import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { calculateAppointmentPrice } from "@/lib/subscription-utils";
import { parseTimeToUTC } from "@/lib/date-utils";
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';
import { notifyAdminAboutNewAppointment } from '@/lib/telegram-utils';
import { NotificationContext } from '@/types/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Получаем ID текущего авторизованного пользователя
    // ✅ JWT авторизация без DB запроса
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return createUnauthorizedResponse();
    }
    
    const { serviceId, appointmentDate, appointmentTime, admin_created, is_admin } = body.data;
    let { paymentMethod } = body.data;
    
    // Валидация
    if (!serviceId || !appointmentDate || !appointmentTime || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Валидация способа оплаты
    const validPaymentMethods = ['card', 'cash', 'subscription'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' }, 
        { status: 400 }
      );
    }

    // Валидация формата даты (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' }, 
        { status: 400 }
      );
    }

    // Валидация формата времени (HH:MM или HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(appointmentTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' }, 
        { status: 400 }
      );
    }

    // Проверка, что дата не в прошлом (если не админ)
    if (!is_admin) {
      const inputDate = new Date(appointmentDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        return NextResponse.json(
          { error: 'Cannot book appointments in the past' }, 
          { status: 400 }
        );
      }

      // Проверка временного ограничения - не более 3 недель вперед
      const maxBookingDate = new Date();
      maxBookingDate.setDate(maxBookingDate.getDate() + 21); // +3 недели
      maxBookingDate.setHours(23, 59, 59, 999); // До конца дня
      
      if (inputDate > maxBookingDate) {
        return NextResponse.json(
          { error: 'Cannot book appointments more than 3 weeks ahead' }, 
          { status: 400 }
        );
      }
    }

    // Проверка активных записей пользователя (если не админ)
    if (!is_admin) {
      const existingActiveAppointments = await prisma.appointments.findMany({
        where: {
          user_id: userId,
          status: {
            in: ['pending', 'confirmed']
          }
        }
      });

      if (existingActiveAppointments.length > 0) {
        return NextResponse.json(
          { error: 'You already have an active appointment. Please complete or cancel it before booking a new one.' }, 
          { status: 400 }
        );
      }
    }

    // Проверка конфликтов времени (если не админ с force флагом)
    if (!is_admin) {
      // Создаем объекты дат для проверки
      const appointmentDateObj = new Date(appointmentDate + 'T12:00:00Z');
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const appointmentTimeObj = parseTimeToUTC(`${hours}:${minutes}`);

      // Проверяем конфликты
      const existingAppointments = await prisma.appointments.findMany({
        where: {
          appointment_date: appointmentDateObj,
          time: appointmentTimeObj,
          status: {
            in: ['pending', 'confirmed']
          }
        }
      });

      if (existingAppointments.length > 0) {
        return NextResponse.json(
          { error: 'Time slot is already booked' }, 
          { status: 409 }
        );
      }
    }
    
    // Стандартизированное создание даты и времени
    // Дата всегда в полдень UTC для избежания проблем с timezone
    const appointmentDateObj = new Date(appointmentDate + 'T12:00:00Z');
    
    // Время как отдельное поле в формате UTC
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentTimeObj = parseTimeToUTC(`${hours}:${minutes}`);
    
    // Рассчитываем цену с учетом подписки
    let subscriptionBenefit = null;
    let finalPaymentStatus = 'pending';
    
    // Определяем статус оплаты в зависимости от способа оплаты
    if (paymentMethod === 'cash') {
      finalPaymentStatus = 'cash';
    } else if (paymentMethod === 'subscription') {
      finalPaymentStatus = 'paid'; // Подписка считается оплаченной
    } else if (paymentMethod === 'card') {
      finalPaymentStatus = 'pending';
    }
    
    try {
      subscriptionBenefit = await calculateAppointmentPrice(userId, Number(serviceId));
      
      // 🎁 Автоматически используем купон если есть
      if (subscriptionBenefit.type === 'coupon') {
        paymentMethod = 'coupon';
        finalPaymentStatus = 'paid';
      }
      // 🔄 Валидация для payment_method='subscription'  
      else if (paymentMethod === 'subscription') {
        if (!subscriptionBenefit || subscriptionBenefit.type === 'full') {
          return NextResponse.json(
            { error: 'No valid subscription benefit available for this service' }, 
            { status: 400 }
          );
        }
      }
      
      // If using free visit or discount, payment is considered completed
      if (subscriptionBenefit.type === 'free') {
        finalPaymentStatus = 'paid';
      }
    } catch (error) {
      console.error('Error calculating subscription price:', error);
      
      // Если запрашивается оплата подпиской, но произошла ошибка
      if (paymentMethod === 'subscription') {
        return NextResponse.json(
          { error: 'Failed to verify subscription benefits' }, 
          { status: 500 }
        );
      }
      
      // Continue with regular price if subscription calculation fails
    }
    
    // Рассчитываем финальную цену для статистики
    const finalPriceCharged = subscriptionBenefit?.price || subscriptionBenefit?.originalPrice || 0;
    
    const appointment = await prisma.appointments.create({
      data: {
        service_id: Number(serviceId),
        user_id: userId,
        appointment_date: appointmentDateObj,
        time: appointmentTimeObj,
        payment_method: paymentMethod,
        status: 'confirmed',
        payment_status: finalPaymentStatus,
        subscription_benefit_type: subscriptionBenefit?.type === 'full' ? null : subscriptionBenefit?.type,
        original_service_price: subscriptionBenefit?.originalPrice,
        discount_amount: subscriptionBenefit?.discountAmount,
        final_price_charged: finalPriceCharged,
        coupon_id: subscriptionBenefit?.couponId || null
      }
    });
    
    // Update subscription state if benefit was used
    if (subscriptionBenefit) {
      try {
        if (subscriptionBenefit.type === 'coupon' && subscriptionBenefit.couponId) {
          // 🎁 Деактивируем купон сразу после создания записи
          await prisma.coupons.update({
            where: { id: subscriptionBenefit.couponId },
            data: { is_used: true }
          });
        } else if (subscriptionBenefit.type === 'free' && paymentMethod === 'subscription') {
          // Только если выбрана подписка как способ оплаты для бесплатного визита
          // Обновляем использованные бесплатные визиты напрямую в БД
          await prisma.subscription.update({
            where: { user_id: userId },
            data: {
              free_visits_used: {
                increment: 1
              }
            }
          });
        } else if (subscriptionBenefit.type === 'discount') {
          // Скидка применяется автоматически, но счетчик не изменяется
          // Записываем информацию о скидке в БД, но не обновляем счетчики
        }
      } catch (error) {
        console.error('Error using subscription benefit:', error);
        // Continue even if this fails
      }
    }
    
    // Отправляем уведомление админу о новой записи (только если не админ создал)
    if (!admin_created && !is_admin) {
      console.log(`🔔 [CREATE_ROUTE] Подготовка уведомления админам о новой записи #${appointment.id}`);
      try {
        // Получаем данные для уведомления
        const appointmentWithDetails = await prisma.appointments.findUnique({
          where: { id: appointment.id },
          include: {
            services: {
              select: { name: true }
            }
          }
        });

        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { username: true }
        });

        console.log(`📋 [CREATE_ROUTE] Данные для уведомления:`, {
          appointment: !!appointmentWithDetails,
          user: !!user,
          serviceName: appointmentWithDetails?.services.name,
          userName: user?.username
        });

        if (appointmentWithDetails && user) {
          const notificationContext: NotificationContext = {
            appointmentId: appointment.id,
            userId: userId,
            serviceTitle: appointmentWithDetails.services.name,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime,
            userName: user.username
          };

          console.log(`📤 [CREATE_ROUTE] Отправка уведомления админам о новой записи (ожидаем завершения)`);
          // Дожидаемся отправки уведомления перед ответом клиенту
          try {
            const notificationResult = await notifyAdminAboutNewAppointment(notificationContext);
            console.log(`📊 [CREATE_ROUTE] Результат уведомления админов: ${notificationResult}`);
          } catch (error) {
            console.error(`❌ [CREATE_ROUTE] Ошибка отправки уведомления админу о записи #${appointment.id}:`, error);
          }
        } else {
          console.warn(`⚠️ [CREATE_ROUTE] Недостаточно данных для отправки уведомления:`, {
            appointment: !!appointmentWithDetails,
            user: !!user
          });
        }
      } catch (error) {
        console.error(`❌ [CREATE_ROUTE] Ошибка подготовки уведомления о записи #${appointment.id}:`, error);
        // Не блокируем создание записи из-за ошибки уведомления
      }
    } else {
      console.log(`ℹ️ [CREATE_ROUTE] Уведомление админам не отправляется (admin_created: ${admin_created}, is_admin: ${is_admin})`);
    }
    
    const response = NextResponse.json({
      success: true, 
      id: appointment.id,
      appointmentId: appointment.id,
      subscriptionBenefit: subscriptionBenefit
    }, { status: 201 });

    // Добавляем заголовок для инвалидации кеша в админке
    response.headers.set('X-Invalidate-Admin-Cache', 'appointments');
    
    return response;
    
  } catch (error: unknown) {
    console.error('Database error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create appointment',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}