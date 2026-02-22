/**
 * API endpoints для управления рабочими днями (calendar-driven scheduling)
 * 
 * АРХИТЕКТУРА:
 * GET /api/work-days?date=YYYY-MM-DD - получить конкретный день
 * POST /api/work-days - создать рабочий день
 * PATCH /api/work-days/:id - обновить рабочий день
 * 
 * ЛОГИКА:
 * - Каждый день - отдельная запись с конкретной датой
 * - Запись создается только когда админ настраивает день
 * - НЕТ дефолтного расписания или недельных шаблонов
 * - Источник истины - только записи в БД
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface WorkDayRequest {
  date: string;
  is_working: boolean;
  start_time?: string;
  end_time?: string;
}

/**
 * GET - Получить рабочий день по дате
 * Query: ?date=YYYY-MM-DD
 * 
 * Response:
 * - Если запись найдена: возвращает настройки дня
 * - Если записи нет: возвращает null (не создаем дефолтные настройки!)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'Параметр date обязателен' },
        { status: 400 }
      );
    }

    // Валидация формата даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Неверный формат даты. Ожидается YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const workDay = await prisma.master_settings.findFirst({
      where: {
        date: new Date(date + 'T12:00:00Z') // Используем полдень UTC как в создании записей
      }
    });

    return NextResponse.json({
      success: true,
      data: workDay ? {
        id: workDay.id,
        date: workDay.date ? workDay.date.toISOString().split('T')[0] : date,
        is_working: workDay.is_working,
        start_time: workDay.start_time ? 
          workDay.start_time.toISOString().substring(11, 16) : null,
        end_time: workDay.end_time ? 
          workDay.end_time.toISOString().substring(11, 16) : null
      } : null
    });

  } catch (error) {
    console.error('Ошибка при получении рабочего дня:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при получении рабочего дня' },
      { status: 500 }
    );
  }
}

/**
 * POST - Создать новый рабочий день
 * Body: { date, is_working, start_time?, end_time? }
 */
export async function POST(request: NextRequest) {
  try {
    const body: WorkDayRequest = await request.json();
    const { date, is_working, start_time, end_time } = body;

    // Валидация обязательных полей
    if (!date || typeof is_working !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Поля date и is_working обязательны' },
        { status: 400 }
      );
    }

    // Валидация формата даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Неверный формат даты. Ожидается YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Валидация времени для рабочих дней
    if (is_working) {
      if (!start_time || !end_time) {
        return NextResponse.json(
          { success: false, message: 'Для рабочего дня необходимо указать start_time и end_time' },
          { status: 400 }
        );
      }

      // Валидация формата времени HH:MM
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return NextResponse.json(
          { success: false, message: 'Неверный формат времени. Ожидается HH:MM' },
          { status: 400 }
        );
      }
    }

    // Проверка на дублирование даты
    const existing = await prisma.master_settings.findFirst({
      where: { date: new Date(date + 'T12:00:00Z') }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Рабочий день для этой даты уже существует' },
        { status: 409 }
      );
    }

    // Создание записи
    let startDateTime: Date;
    let endDateTime: Date;

    if (is_working && start_time && end_time) {
      const [startHours, startMinutes] = start_time.split(':');
      const [endHours, endMinutes] = end_time.split(':');
      
      startDateTime = new Date(Date.UTC(1970, 0, 1, parseInt(startHours), parseInt(startMinutes)));
      endDateTime = new Date(Date.UTC(1970, 0, 1, parseInt(endHours), parseInt(endMinutes)));
    } else {
      // Для нерабочих дней устанавливаем дефолтное время
      startDateTime = new Date(Date.UTC(1970, 0, 1, 0, 0));
      endDateTime = new Date(Date.UTC(1970, 0, 1, 0, 0));
    }

    const workDay = await prisma.master_settings.create({
      data: {
        date: new Date(date + 'T12:00:00Z'),
        is_working,
        start_time: startDateTime,
        end_time: endDateTime,
        // Legacy field for backward compatibility
        weekday: new Date(date).getDay() || 7 // 1-7 (Monday-Sunday)
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: workDay.id,
        date: workDay.date ? workDay.date.toISOString().split('T')[0] : date,
        is_working: workDay.is_working,
        start_time: workDay.start_time ? 
          workDay.start_time.toISOString().substring(11, 16) : null,
        end_time: workDay.end_time ? 
          workDay.end_time.toISOString().substring(11, 16) : null
      },
      message: 'Рабочий день успешно создан'
    });

  } catch (error) {
    console.error('Ошибка при создании рабочего дня:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при создании рабочего дня' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Обновить существующий рабочий день
 * Body: { id, date, is_working, start_time?, end_time? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: WorkDayRequest & { id: number } = await request.json();
    const { id, date, is_working, start_time, end_time } = body;

    // Валидация обязательных полей
    if (!id || !date || typeof is_working !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Поля id, date и is_working обязательны' },
        { status: 400 }
      );
    }

    // Валидация времени для рабочих дней
    if (is_working) {
      if (!start_time || !end_time) {
        return NextResponse.json(
          { success: false, message: 'Для рабочего дня необходимо указать start_time и end_time' },
          { status: 400 }
        );
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return NextResponse.json(
          { success: false, message: 'Неверный формат времени. Ожидается HH:MM' },
          { status: 400 }
        );
      }
    }

    // Проверка существования записи
    const existing = await prisma.master_settings.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Рабочий день не найден' },
        { status: 404 }
      );
    }

    // Обновление записи
    let updateStartTime: Date;
    let updateEndTime: Date;

    if (is_working && start_time && end_time) {
      const [startHours, startMinutes] = start_time.split(':');
      const [endHours, endMinutes] = end_time.split(':');
      
      updateStartTime = new Date(Date.UTC(1970, 0, 1, parseInt(startHours), parseInt(startMinutes)));
      updateEndTime = new Date(Date.UTC(1970, 0, 1, parseInt(endHours), parseInt(endMinutes)));
    } else {
      // Для нерабочих дней устанавливаем дефолтное время
      updateStartTime = new Date(Date.UTC(1970, 0, 1, 0, 0));
      updateEndTime = new Date(Date.UTC(1970, 0, 1, 0, 0));
    }

    const workDay = await prisma.master_settings.update({
      where: { id },
      data: {
        date: new Date(date + 'T12:00:00Z'),
        is_working,
        start_time: updateStartTime,
        end_time: updateEndTime,
        // Update legacy field
        weekday: new Date(date).getDay() || 7
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: workDay.id,
        date: workDay.date ? workDay.date.toISOString().split('T')[0] : date,
        is_working: workDay.is_working,
        start_time: workDay.start_time ? 
          workDay.start_time.toISOString().substring(11, 16) : null,
        end_time: workDay.end_time ? 
          workDay.end_time.toISOString().substring(11, 16) : null
      },
      message: 'Рабочий день успешно обновлен'
    });

  } catch (error) {
    console.error('Ошибка при обновлении рабочего дня:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при обновлении рабочего дня' },
      { status: 500 }
    );
  }
}