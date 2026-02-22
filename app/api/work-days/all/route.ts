/**
 * API endpoint для получения всех настроенных рабочих дней
 * GET /api/work-days/all - получить все дни с датами
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Получаем все записи где date не null (настроенные дни)
    const workDays = await prisma.master_settings.findMany({
      where: {
        date: {
          not: null
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const formattedWorkDays = workDays
      .filter(day => day.date) // Дополнительная проверка
      .map(day => ({
        id: day.id,
        date: day.date!.toISOString().split('T')[0],
        is_working: day.is_working,
        start_time: day.start_time ? 
          day.start_time.toISOString().substring(11, 16) : null,
        end_time: day.end_time ? 
          day.end_time.toISOString().substring(11, 16) : null
      }));

    return NextResponse.json({
      success: true,
      data: formattedWorkDays
    });

  } catch (error) {
    console.error('Ошибка при получении всех рабочих дней:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при получении рабочих дней' },
      { status: 500 }
    );
  }
}