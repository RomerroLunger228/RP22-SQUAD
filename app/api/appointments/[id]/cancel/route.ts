import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';
import { notifyAdminAboutCancelledAppointment } from '@/lib/telegram-utils';
import { NotificationContext } from '@/types/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ JWT авторизация без DB запроса
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;
    const appointmentId = parseInt(id);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Проверяем что запись существует и принадлежит авторизованному пользователю
    const appointment = await prisma.appointments.findFirst({
      where: {
        id: appointmentId,
        user_id: userId
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Проверяем что запись можно отменить
    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { error: 'Appointment is already canceled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed appointment' },
        { status: 400 }
      );
    }

    // Обновляем статус на canceled
    const updatedAppointment = await prisma.appointments.update({
      where: {
        id: appointmentId
      },
      data: {
        status: 'canceled'
      },
      include: {
        services: {
          select: { name: true }
        }
      }
    });

    // Уведомляем админов об отмене записи
    console.log(`🔔 [CANCEL_ROUTE] Подготовка уведомления админам об отмене записи #${updatedAppointment.id}`);
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      console.log(`📋 [CANCEL_ROUTE] Данные пользователя для уведомления:`, {
        userId,
        userName: user?.username
      });

      if (user) {
        const notificationContext: NotificationContext = {
          appointmentId: updatedAppointment.id,
          userId: userId,
          serviceTitle: updatedAppointment.services.name,
          appointmentDate: updatedAppointment.appointment_date.toISOString(),
          appointmentTime: updatedAppointment.time ? 
            (typeof updatedAppointment.time === 'string' ? 
              updatedAppointment.time : 
              updatedAppointment.time.toString()) : '',
          userName: user.username
        };

        console.log(`📤 [CANCEL_ROUTE] Отправка уведомления админам об отмене (ожидаем завершения)`);
        // Дожидаемся отправки уведомления перед ответом клиенту
        try {
          const notificationResult = await notifyAdminAboutCancelledAppointment(notificationContext);
          console.log(`📊 [CANCEL_ROUTE] Результат уведомления админов: ${notificationResult}`);
        } catch (error) {
          console.error(`❌ [CANCEL_ROUTE] Ошибка отправки уведомления админу об отмене записи #${updatedAppointment.id}:`, error);
        }
      } else {
        console.warn(`⚠️ [CANCEL_ROUTE] Пользователь не найден для отправки уведомления об отмене (userId: ${userId})`);
      }
    } catch (error) {
      console.error(`❌ [CANCEL_ROUTE] Ошибка подготовки уведомления об отмене записи #${updatedAppointment.id}:`, error);
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment canceled successfully',
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status
      }
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}