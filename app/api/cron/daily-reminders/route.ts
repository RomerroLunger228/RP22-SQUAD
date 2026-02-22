import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { formatTimeFromDB } from "@/lib/date-utils";
import { sendDailyReminderNotification } from "@/lib/telegram-utils";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию для защиты от несанкционированных вызовов
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_KEY;
  
  if (!expectedToken) {
    console.error('❌ [DAILY_REMINDERS] CRON_SECRET_KEY не установлен в переменных окружения');
    return NextResponse.json({ 
      error: 'Server configuration error' 
    }, { status: 500 });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedToken) {
    console.error('❌ [DAILY_REMINDERS] Неавторизованный запуск cron задачи');
    return NextResponse.json({ 
      error: 'Unauthorized' 
    }, { status: 401 });
  }
  try {
    console.log(`🌅 [DAILY_REMINDERS] Запуск ежедневной проверки напоминаний`);
    
    // Получаем сегодняшний день в UTC (как хранится в БД)
    const today = new Date();
    const todayUTC = new Date(today.toISOString().split('T')[0] + 'T12:00:00Z');
    
    console.log(`📅 [DAILY_REMINDERS] Ищем записи на дату: ${todayUTC.toISOString()}`);
    
    // Ищем все записи на сегодня, которым еще не отправлялись напоминания
    const todayAppointments = await prisma.appointments.findMany({
      where: {
        appointment_date: todayUTC,
        status: 'confirmed',
        daily_reminder_sent: false
      },
      include: {
        services: { 
          select: { 
            name: true 
          } 
        }
      },
      orderBy: {
        time: 'asc'
      }
    });

    console.log(`📋 [DAILY_REMINDERS] Найдено записей для напоминаний: ${todayAppointments.length}`);

    if (todayAppointments.length === 0) {
      console.log(`✅ [DAILY_REMINDERS] Нет записей на сегодня для отправки напоминаний`);
      return NextResponse.json({ 
        success: true, 
        message: 'No appointments found for today',
        processed: 0
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Отправляем напоминания каждому пользователю
    for (const appointment of todayAppointments) {
      try {
        // Получаем данные пользователя
        const user = await prisma.users.findUnique({
          where: { id: appointment.user_id },
          select: { username: true }
        });

        if (!user) {
          console.error(`❌ [DAILY_REMINDERS] Пользователь с ID ${appointment.user_id} не найден`);
          continue;
        }

        console.log(`📤 [DAILY_REMINDERS] Отправка напоминания для записи #${appointment.id} пользователю ${user.username}`);
        
        // Форматируем время для отображения
        const appointmentTime = formatTimeFromDB(appointment.time);
        const appointmentDate = appointment.appointment_date.toISOString().split('T')[0];
        
        // Отправляем уведомление через Telegram
        await sendDailyReminderNotification({
          userId: appointment.user_id.toString(),
          userName: user.username,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime || '',
          serviceName: appointment.services.name,
          appointmentId: appointment.id
        });
        
        // Помечаем напоминание как отправленное
        await prisma.appointments.update({
          where: { id: appointment.id },
          data: { daily_reminder_sent: true }
        });
        
        successCount++;
        console.log(`✅ [DAILY_REMINDERS] Напоминание успешно отправлено для записи #${appointment.id}`);
        
      } catch (error) {
        console.error(`❌ [DAILY_REMINDERS] Ошибка отправки напоминания для записи #${appointment.id}:`, error);
        errorCount++;
        // Продолжаем обработку остальных записей даже при ошибке
      }
    }
    
    console.log(`📊 [DAILY_REMINDERS] Завершено. Успешно: ${successCount}, Ошибок: ${errorCount}`);
    
    return NextResponse.json({
      success: true,
      processed: todayAppointments.length,
      successful: successCount,
      errors: errorCount,
      date: todayUTC.toISOString().split('T')[0]
    });
    
  } catch (error: unknown) {
    console.error('❌ [DAILY_REMINDERS] Критическая ошибка при обработке ежедневных напоминаний:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process daily reminders',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}