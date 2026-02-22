import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUserAboutAppointmentStatus, notifyReferrerAboutCompletedReferral } from '@/lib/telegram-utils';
import { NotificationAction, NotificationContext } from '@/types/notifications';

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// 🎁 РЕФЕРАЛЬНАЯ СИСТЕМА: Логика начисления купонов
interface AppointmentForReferral {
  user_id: number;
  id: number;
}

async function processReferralReward(tx: PrismaTransaction, appointment: AppointmentForReferral) {
  try {
    // Шаг 1-2: Получить пользователя
    const user = await tx.users.findUnique({
      where: { id: appointment.user_id }
    });

    // Шаг 3: Если пользователь НЕ реферал → выход
    if (!user?.referred_by) {
      console.log(`[REFERRAL] Пользователь ${appointment.user_id} не является рефералом`);
      return;
    }

    // Шаг 4: Посчитать completed визиты пользователя
    const completedCount = await tx.appointments.count({
      where: {
        user_id: user.id,
        status: 'completed'
      }
    });

    // Шаг 5: Засчитывать ТОЛЬКО если это первый визит
    if (completedCount !== 1) {
      console.log(`[REFERRAL] Пользователь ${appointment.user_id} уже имеет ${completedCount} завершенных визитов`);
      return;
    }

    console.log(`[REFERRAL] Первый завершенный визит реферала ${appointment.user_id}, реферер: ${user.referred_by}`);

    // Шаг 6: Увеличить счётчик рефералов пригласившему
    await tx.users.update({
      where: { telegram_id: user.referred_by },
      data: {
        referral_completed_unique: { increment: 1 }
      }
    });

    // Шаг 7-8: Проверить, положен ли новый купон
    const referrer = await tx.users.findUnique({
      where: { telegram_id: user.referred_by }
    });

    if (!referrer) {
      console.log(`[REFERRAL] Реферер ${user.referred_by} не найден`);
      return;
    }

    const rewardsAvailable = Math.floor(referrer.referral_completed_unique / 5);
    const needMoreForNextCoupon = 5 - (referrer.referral_completed_unique % 5);
    let couponCreated = false;
    
    // Шаг 8: Проверка: нужно ли создать новый купон
    if (rewardsAvailable > referrer.referral_rewards_used) {
      console.log(`[REFERRAL] Создание купона для реферера ${referrer.id}. Доступно наград: ${rewardsAvailable}, использовано: ${referrer.referral_rewards_used}`);
      
      // Шаг 9: Создать купон
      await tx.coupons.create({
        data: {
          user_id: referrer.id
        }
      });

      // Шаг 10: Обновить счётчик использованных наград
      await tx.users.update({
        where: { id: referrer.id },
        data: {
          referral_rewards_used: { increment: 1 }
        }
      });

      couponCreated = true;
      console.log(`[REFERRAL] Купон успешно создан для пользователя ${referrer.id}`);
    } else {
      console.log(`[REFERRAL] Купон не нужен. Доступно: ${rewardsAvailable}, использовано: ${referrer.referral_rewards_used}`);
    }

    // 🔔 Уведомление реферера о завершенном визите друга
    console.log(`[REFERRAL] Отправка уведомления реферру ${user.referred_by} о завершении визита ${user.username}`);
    try {
      await notifyReferrerAboutCompletedReferral(
        user.referred_by,
        user.username,
        referrer.referral_completed_unique,
        couponCreated ? 0 : needMoreForNextCoupon
      );
    } catch (notificationError) {
      console.error('[REFERRAL] Ошибка отправки уведомления реферру:', notificationError);
      // Не бросаем ошибку, чтобы не нарушить основной процесс
    }
  } catch (error) {
    console.error('[REFERRAL] Ошибка в реферальной логике:', error);
    // Не бросаем ошибку, чтобы не нарушить основной процесс
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;
    const appointmentId = parseInt(id);

    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'canceled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update appointment status in database
    const result = await prisma.$transaction(async (tx: PrismaTransaction) => {
      const updatedAppointment = await tx.appointments.update({
        where: {
          id: appointmentId
        },
        data: {
          status: status
        },
        include: {
          services: true
        }
      })
      if(!updatedAppointment){
        throw new Error('Appointment not found');
      }
      await tx.users.update({
        where: {
          id: updatedAppointment.user_id
        },
        data: {
          points: {
            increment: updatedAppointment.services.points
          }
        }
      })

      // 🎁 РЕФЕРРАЛЬНАЯ ЛОГИКА - начисление купонов при завершении первого визита
      if (status === 'completed') {
        await processReferralReward(tx, updatedAppointment);
      }

      return {updatedAppointment};
    });

    // Отправляем уведомление пользователю об изменении статуса
    console.log(`🔔 [STATUS_ROUTE] Подготовка уведомления пользователю о смене статуса записи #${result.updatedAppointment.id} на '${status}'`);
    try {
      const user = await prisma.users.findUnique({
        where: { id: result.updatedAppointment.user_id },
        select: { username: true, telegram_id: true }
      });

      console.log(`📋 [STATUS_ROUTE] Данные пользователя:`, {
        userId: result.updatedAppointment.user_id,
        userName: user?.username,
        hasTelegramId: !!user?.telegram_id
      });

      if (user && user.telegram_id) {
        // Определяем тип уведомления по статусу
        let notificationAction: NotificationAction;
        switch (status) {
          case 'confirmed':
            notificationAction = 'appointment_confirmed';
            break;
          case 'canceled':
            notificationAction = 'appointment_rejected';
            break;
          case 'completed':
            notificationAction = 'appointment_completed';
            break;
          case 'no_show':
            notificationAction = 'appointment_no_show';
            break;
          default:
            // Не отправляем уведомления для других статусов
            console.log(`ℹ️ [STATUS_ROUTE] Не отправляем уведомление для статуса: ${status}`);
            notificationAction = 'appointment_confirmed'; // fallback
            break;
        }

        console.log(`📋 [STATUS_ROUTE] Определен тип уведомления: ${notificationAction}`);

        const notificationContext: NotificationContext = {
          appointmentId: result.updatedAppointment.id,
          userId: result.updatedAppointment.user_id,
          serviceTitle: result.updatedAppointment.services.name,
          appointmentDate: result.updatedAppointment.appointment_date.toISOString().split('T')[0], // YYYY-MM-DD формат как при создании
          appointmentTime: result.updatedAppointment.time ? result.updatedAppointment.time.toString() : '', // Используем время как есть из БД (HH:MM:SS)
          userName: user.username
        };

        console.log(`📤 [STATUS_ROUTE] Отправка уведомления пользователю о статусе (ожидаем завершения)`);
        // Дожидаемся отправки уведомления перед ответом клиенту
        try {
          const notificationResult = await notifyUserAboutAppointmentStatus(
            notificationAction,
            user.telegram_id,
            notificationContext
          );
          console.log(`📊 [STATUS_ROUTE] Результат уведомления пользователя: ${notificationResult}`);
        } catch (error) {
          console.error(`❌ [STATUS_ROUTE] Ошибка отправки уведомления пользователю о статусе записи #${result.updatedAppointment.id}:`, error);
        }
      } else {
        console.warn(`⚠️ [STATUS_ROUTE] Пользователь не найден или нет telegram_id:`, {
          userId: result.updatedAppointment.user_id,
          userFound: !!user,
          hasTelegramId: !!user?.telegram_id
        });
      }
    } catch (error) {
      console.error(`❌ [STATUS_ROUTE] Ошибка подготовки уведомления пользователю о статусе записи #${result.updatedAppointment.id}:`, error);
    }
    

    return NextResponse.json({
      success: true,
      message: `Appointment ${appointmentId} status updated to ${status}`,
      appointment: {
        id: result.updatedAppointment.id,
        status: result.updatedAppointment.status,
        service: {
          name: result.updatedAppointment.services.name,
          pl_price: result.updatedAppointment.services.pl_price
        }
      }
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}