/**
 * API endpoint для управления конкретным рабочим днем по ID
 * 
 * PATCH /api/work-days/[id] - обновить рабочий день
 * DELETE /api/work-days/[id] - удалить рабочий день (опционально)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface WorkDayUpdateRequest {
  date?: string;
  is_working?: boolean;
  start_time?: string;
  end_time?: string;
}

/**
 * PATCH - Обновить рабочий день по ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Неверный ID' },
        { status: 400 }
      );
    }

    const body: WorkDayUpdateRequest = await request.json();
    const { date, is_working, start_time, end_time } = body;

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

    // Валидация данных
    if (is_working !== undefined && typeof is_working !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Поле is_working должно быть boolean' },
        { status: 400 }
      );
    }

    // Валидация времени
    if (is_working && (!start_time || !end_time)) {
      return NextResponse.json(
        { success: false, message: 'Для рабочего дня необходимо указать start_time и end_time' },
        { status: 400 }
      );
    }

    if (start_time || end_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if ((start_time && !timeRegex.test(start_time)) || 
          (end_time && !timeRegex.test(end_time))) {
        return NextResponse.json(
          { success: false, message: 'Неверный формат времени. Ожидается HH:MM' },
          { status: 400 }
        );
      }
    }

    // Подготовка данных для обновления  
    const updateData: Partial<{
      weekday: number;
      is_working: boolean;
      start_time: Date;
      end_time: Date | null;
      date: Date | null;
    }> = {};
    
    if (date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          { success: false, message: 'Неверный формат даты. Ожидается YYYY-MM-DD' },
          { status: 400 }
        );
      }
      updateData.date = new Date(date + 'T12:00:00Z');
      updateData.weekday = new Date(date + 'T12:00:00Z').getDay() || 7;
    }

    if (is_working !== undefined) {
      updateData.is_working = is_working;
      // Если день становится нерабочим, оставляем время как есть в существующей схеме
    }

    if (is_working !== false) {
      if (start_time !== undefined) {
        // Преобразуем строку времени в Date для БД
        const [hours, minutes] = start_time.split(':');
        updateData.start_time = new Date(Date.UTC(1970, 0, 1, parseInt(hours), parseInt(minutes)));
      }
      if (end_time !== undefined) {
        // Преобразуем строку времени в Date для БД  
        const [hours, minutes] = end_time.split(':');
        updateData.end_time = new Date(Date.UTC(1970, 0, 1, parseInt(hours), parseInt(minutes)));
      }
    }

    // Обновление записи
    const workDay = await prisma.master_settings.update({
      where: { id },
      data: updateData
    });

    // Временно используем переданную дату, пока схема не обновлена
    const responseDate = date || existing.date?.toISOString().split('T')[0] || '2024-01-01';

    return NextResponse.json({
      success: true,
      data: {
        id: workDay.id,
        date: responseDate,
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

/**
 * DELETE - Удалить рабочий день (установить is_working = false)
 * Согласно архитектуре, мы НЕ удаляем записи физически
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Неверный ID' },
        { status: 400 }
      );
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

    // "Удаление" = установка is_working в false
    const workDay = await prisma.master_settings.update({
      where: { id },
      data: {
        is_working: false
      }
    });

    const responseDate = existing.date?.toISOString().split('T')[0] || '2024-01-01';

    return NextResponse.json({
      success: true,
      data: {
        id: workDay.id,
        date: responseDate,
        is_working: workDay.is_working,
        start_time: workDay.start_time ? 
          workDay.start_time.toISOString().substring(11, 16) : null,
        end_time: workDay.end_time ? 
          workDay.end_time.toISOString().substring(11, 16) : null
      },
      message: 'Рабочий день отключен'
    });

  } catch (error) {
    console.error('Ошибка при удалении рабочего дня:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при удалении рабочего дня' },
      { status: 500 }
    );
  }
}