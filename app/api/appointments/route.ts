import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { formatTimeFromDB, formatTimeForDisplay } from '@/lib/date-utils';
import { getCurrentUser, createUnauthorizedResponse } from '@/lib/auth-jwt';

interface AppointmentWithServices {
  id: number;
  appointment_date: Date;
  time: unknown;
  status: string | null;
  subscription_benefit_type: string | null;
  original_service_price: number | null;
  discount_amount: number | null;
  final_price_charged: number | null;
  created_at: Date | null;
  payment_method: string | null;
  user_id: number;
  services: {
    name: string;
    duration_minutes: number;
    pl_price: number;
    haircut_categories: {
      id: number;
      name: string;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    const authenticatedUser = await getCurrentUser(request);
    
    if (!authenticatedUser) {
      return createUnauthorizedResponse();
    }
    
    // Проверяем параметры
    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get('admin') === 'true';
    const activeOnly = url.searchParams.get('active') === 'true';
    
    const userId = authenticatedUser.userId;
    
    // 🚫 Admin проверка перенесена в админские routes
    // Обычные пользователи видят только свои appointments
    if (isAdminRequest) {
      // Для admin запросов нужно проверить роль в DB
      const userWithRole = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!userWithRole || userWithRole.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    const canAccessAdminData = isAdminRequest;
    
    // Если запрашиваются только активные записи
    if (activeOnly) {
      const activeAppointments = await prisma.appointments.findMany({
        where: {
          user_id: userId,
          status: {
            in: ['pending', 'confirmed']
          }
        }
      });
      return NextResponse.json(activeAppointments);
    }
    
    // Получаем записи с данными услуг и категорий
    const appointments = await prisma.appointments.findMany({
      where: canAccessAdminData ? {} : {
        user_id: userId // Для обычных пользователей - только свои записи
      },
      include: {
        services: {
          include: {
            haircut_categories: true
          }
        },
      },
      orderBy: [
        {
          appointment_date: 'desc'
        },
        {
          created_at: 'desc'
        }
      ]
    });

    // Получаем usernames для админских запросов
    let userMap: Map<number, string> = new Map();
    if (canAccessAdminData && appointments.length > 0) {
      const userIds = [...new Set(appointments.map(apt => apt.user_id).filter(Boolean))];
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true }
      });
      userMap = new Map(users.map(user => [user.id, user.username]));
    }

    // Преобразуем данные для фронтенда
    const formattedAppointments = appointments.map((appointment: AppointmentWithServices) => ({
      id: appointment.id,
      appointment_date: appointment.appointment_date.toISOString().split('T')[0], // YYYY-MM-DD
      time: appointment.time 
        ? formatTimeForDisplay(formatTimeFromDB(appointment.time as Date | null))
        : null,
      status: appointment.status || 'pending', // Дефолтный статус если не задан
      service: {
        name: appointment.services.name,
        duration_minutes: appointment.services.duration_minutes,
        pl_price: appointment.services.pl_price
      },
      category: {
        id: appointment.services.haircut_categories.id,
        name: appointment.services.haircut_categories.name
      },
      created_at: appointment.created_at?.toISOString() || null,
      payment_method: appointment.payment_method,
      // Информация о пользователе
      user_id: appointment.user_id || 0,
      username: canAccessAdminData ? userMap.get(appointment.user_id) || null : null,
      // Поля подписки
      subscription_benefit_type: appointment.subscription_benefit_type,
      original_service_price: appointment.original_service_price,
      discount_amount: appointment.discount_amount,
      final_price_charged: appointment.final_price_charged
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' }, 
      { status: 500 }
    );
  }
}