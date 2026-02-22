import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { formatTimeFromDB } from '@/lib/date-utils';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';

interface AppointmentWithService {
  appointment_date: Date;
  time: unknown;
  status: string | null;
  services: {
    name: string;
    points: number | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // Получаем записи на прием для пользователя со статусом completed
    const appointments = await prisma.appointments.findMany({
      where: {
        user_id: userId,
        status: 'completed'
      },
      include: {
        services: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    // Преобразуем данные в формат для фронтенда
    const visits = appointments.map((appointment: AppointmentWithService) => {
      // Используем UTC дату из БД
      const appointmentDate = new Date(appointment.appointment_date);
      
      // Форматируем дату в русском формате (6 янв)
      const dateString = appointmentDate.toLocaleDateString('ru-RU', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Europe/Warsaw'
      });

      // Используем helper функцию для времени
      const timeFromDB = formatTimeFromDB(appointment.time as Date | null);
      const timeString = timeFromDB 
        ? new Date(`1970-01-01T${timeFromDB}`).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Warsaw'
          })
        : appointmentDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Warsaw'
          });

      

      return {
        serviceName: appointment.services.name,
        date: dateString,
        time: timeString,
        points: appointment.services.points
      };
    });
    return NextResponse.json(visits);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visits' }, 
      { status: 500 }
    );
  }
}