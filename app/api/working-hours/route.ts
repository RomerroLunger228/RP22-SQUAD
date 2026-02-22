/**
 * API endpoint для управления рабочими часами
 * 
 * ЛОГИКА:
 * GET - получить все рабочие дни
 * POST - создать/обновить рабочие дни
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatTimeFromDB, formatTimeForDisplay, parseTimeToUTC } from '@/lib/date-utils';

interface MasterSetting {
  id: number;
  weekday: number | null;
  start_time: Date | null;
  end_time: Date | null;
  is_working: boolean | null;
}

interface WorkingDay {
  weekday: number;
  start_time?: string;
  end_time?: string;
  is_working: boolean;
}

const WEEKDAY_NAMES = {
  1: 'Понедельник',
  2: 'Вторник', 
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье'
};

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 7]; // Пн-Сб, Вс

/**
 * GET - Получить все рабочие дни
 * Возвращает настройки для всех 7 дней недели
 */
export async function GET() {
  try {
    const workingDays = await prisma.master_settings.findMany({
      orderBy: {
        weekday: 'asc'
      }
    });

    // Убеждаемся что есть настройки для всех 7 дней
    const fullWeekSettings = [];
    for (const weekday of WEEKDAY_ORDER) {
      const existing = workingDays.find((day: MasterSetting) => day.weekday === weekday);
      if (existing) {
        fullWeekSettings.push({
          id: existing.id,
          weekday: existing.weekday,
          start_time: existing.is_working ? formatTimeForDisplay(formatTimeFromDB(existing.start_time)) : null,
          end_time: existing.is_working ? formatTimeForDisplay(formatTimeFromDB(existing.end_time)) : null,
          is_working: existing.is_working
        });
      } else {
        // Создаем дефолтные настройки для отсутствующих дней
        const isWorkingDay = weekday >= 1 && weekday <= 5; // Пн-Пт (1-5), Сб=6, Вс=7
        const defaultSetting = await prisma.master_settings.create({
          data: {
            weekday: weekday,
            start_time: isWorkingDay ? new Date(Date.UTC(1970, 0, 1, 9, 0, 0)) : new Date(Date.UTC(1970, 0, 1, 0, 0, 0)),
            end_time: isWorkingDay ? new Date(Date.UTC(1970, 0, 1, 18, 0, 0)) : null,
            is_working: isWorkingDay // Пн-Пт работает, выходные нет
          }
        });
        
        fullWeekSettings.push({
          id: defaultSetting.id,
          weekday: defaultSetting.weekday,
          start_time: defaultSetting.is_working ? formatTimeForDisplay(formatTimeFromDB(defaultSetting.start_time)) : null,
          end_time: defaultSetting.is_working ? formatTimeForDisplay(formatTimeFromDB(defaultSetting.end_time)) : null,
          is_working: defaultSetting.is_working
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: fullWeekSettings
    });

  } catch (error) {
    console.error('Ошибка при получении рабочих дней:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка при получении настроек рабочих дней' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Обновить рабочий день
 * Принимает массив рабочих дней для обновления
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { workingDays } = body;

    if (!Array.isArray(workingDays)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Некорректный формат данных' 
        },
        { status: 400 }
      );
    }

    // Валидация данных
    for (const day of workingDays as WorkingDay[]) {
      if (typeof day.weekday !== 'number' || (day.weekday < 1 || day.weekday > 7)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Некорректный день недели: ${day.weekday}` 
          },
          { status: 400 }
        );
      }

      if (day.is_working) {
        if (!day.start_time || !day.end_time) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Для рабочего дня ${WEEKDAY_NAMES[day.weekday as keyof typeof WEEKDAY_NAMES]} необходимо указать время начала и окончания работы` 
            },
            { status: 400 }
          );
        }

        // Проверка корректности времени (поддержка работы через полночь)
        const [startHour, startMinute] = day.start_time!.split(':').map(Number);
        const [endHour, endMinute] = day.end_time!.split(':').map(Number);
        
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        let duration = endTotalMinutes - startTotalMinutes;
        
        // Если отрицательная продолжительность - работа через полночь
        if (duration <= 0) {
          duration = (24 * 60) + duration; // добавляем сутки
        }
        
        // Проверяем разумные границы (30 мин - 16 часов)
        if (duration < 30 || duration > 16 * 60) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Некорректная продолжительность работы для дня ${WEEKDAY_NAMES[day.weekday as keyof typeof WEEKDAY_NAMES]} (от 30 минут до 16 часов)` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Обновление данных
    const updatedDays = [];
    for (const day of workingDays as WorkingDay[]) {
      let startTime, endTime;
      
      if (day.is_working && day.start_time) {
        startTime = parseTimeToUTC(day.start_time);
      } else {
        startTime = new Date(Date.UTC(1970, 0, 1, 0, 0, 0)); // Дефолтное время для нерабочих дней
      }
      
      if (day.is_working && day.end_time) {
        endTime = parseTimeToUTC(day.end_time);
      } else {
        endTime = null;
      }

      // Находим существующую запись по weekday
      const existing = await prisma.master_settings.findFirst({
        where: { weekday: day.weekday }
      });

      let updated;
      if (existing) {
        updated = await prisma.master_settings.update({
          where: { id: existing.id },
          data: {
            start_time: startTime,
            end_time: endTime,
            is_working: day.is_working
          }
        });
      } else {
        updated = await prisma.master_settings.create({
          data: {
            weekday: day.weekday,
            start_time: startTime,
            end_time: endTime,
            is_working: day.is_working
          }
        });
      }

      updatedDays.push({
        id: updated.id,
        weekday: updated.weekday,
        start_time: updated.is_working ? formatTimeForDisplay(formatTimeFromDB(updated.start_time)) : null,
        end_time: updated.is_working ? formatTimeForDisplay(formatTimeFromDB(updated.end_time)) : null,
        is_working: updated.is_working
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedDays,
      message: 'Настройки рабочих дней успешно обновлены'
    });

  } catch (error) {
    console.error('Ошибка при обновлении рабочих дней:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка при обновлении настроек рабочих дней' 
      },
      { status: 500 }
    );
  }
}