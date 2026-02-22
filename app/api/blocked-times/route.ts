// app/api/blocked-times/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { formatTimeFromDB, formatTimeForDisplay, parseTimeToUTC } from '@/lib/date-utils';

interface BlockedTimeFromPrisma {
  id: number;
  date: Date | null;
  start_time: unknown;
  end_time: unknown;
  reason: string | null;
}

// GET /api/blocked-times - получить все заблокированные времена
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        
        let whereCondition = {};
        
        // Если указана дата, фильтруем по ней
        if (date) {
            const [year, month, day] = date.split('-').map(Number);
            const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
            whereCondition = { date: targetDate };
        }
        
        const blockedTimes = await prisma.blocked_times.findMany({
            where: whereCondition,
            orderBy: [
                { date: 'asc' },
                { start_time: 'asc' }
            ]
        });
        
        return NextResponse.json({
            success: true,
            blockedTimes: blockedTimes.map((bt: BlockedTimeFromPrisma) => ({
                id: bt.id,
                date: bt.date?.toISOString().split('T')[0] || null,
                start_time: formatTimeFromDB(bt.start_time as Date | null),
                end_time: formatTimeFromDB(bt.end_time as Date | null),
                reason: bt.reason
            }))
        });
        
    } catch (error) {
        console.error('Error fetching blocked times:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка получения заблокированных времен' },
            { status: 500 }
        );
    }
}

// POST /api/blocked-times - создать новое заблокированное время
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, start_time, end_time, reason } = body;
        
        // Валидация
        if (!date || !start_time || !end_time) {
            return NextResponse.json(
                { success: false, error: 'Обязательные поля: date, start_time, end_time' },
                { status: 400 }
            );
        }
        
        // Проверка, что время окончания больше времени начала
        if (start_time >= end_time) {
            return NextResponse.json(
                { success: false, error: 'Время окончания должно быть больше времени начала' },
                { status: 400 }
            );
        }
        
        // Парсим дату
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
        
        const startTimeDate = parseTimeToUTC(start_time);
        const endTimeDate = parseTimeToUTC(end_time);
        
        // Проверяем пересечения с существующими блокировками в этот день
        const existingBlocked = await prisma.blocked_times.findMany({
            where: { date: targetDate }
        });
        
        for (const existing of existingBlocked) {
            const existingStart = existing.start_time;
            const existingEnd = existing.end_time;
            
            if (existingStart && existingEnd) {
                // Проверяем пересечение времен
                const newStart = startTimeDate.getTime();
                const newEnd = endTimeDate.getTime();
                const oldStart = existingStart.getTime();
                const oldEnd = existingEnd.getTime();
                
                if (!(newEnd <= oldStart || newStart >= oldEnd)) {
                    return NextResponse.json(
                        { 
                            success: false, 
                            error: `Пересечение с существующей блокировкой: ${formatTimeForDisplay(formatTimeFromDB(existing.start_time))} - ${formatTimeForDisplay(formatTimeFromDB(existing.end_time))}` 
                        },
                        { status: 400 }
                    );
                }
            }
        }
        
        // Создаем новое заблокированное время
        const newBlockedTime = await prisma.blocked_times.create({
            data: {
                date: targetDate,
                start_time: startTimeDate,
                end_time: endTimeDate,
                reason: reason || "Заблокировано"
            }
        });
        
        return NextResponse.json({
            success: true,
            blockedTime: {
                id: newBlockedTime.id,
                date: newBlockedTime.date?.toISOString().split('T')[0] || null,
                start_time: formatTimeFromDB(newBlockedTime.start_time),
                end_time: formatTimeFromDB(newBlockedTime.end_time),
                reason: newBlockedTime.reason
            }
        }, { status: 201 });
        
    } catch (error) {
        console.error('Error creating blocked time:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка создания заблокированного времени' },
            { status: 500 }
        );
    }
}