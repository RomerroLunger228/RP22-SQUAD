import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { formatTimeFromDB, formatTimeForDisplay } from '@/lib/date-utils';

interface MasterSetting {
  id: number;
  weekday: number | null;
  start_time: unknown;
  end_time: unknown;
}

export async function GET() {
    try {
        const workingHours = await prisma.master_settings.findMany();
        const formattedSchedule = workingHours.map((day: MasterSetting) => ({
            id: day.id,
            weekday: day.weekday,
            start_time: formatTimeForDisplay(formatTimeFromDB(day.start_time as Date | null)),
            end_time: formatTimeForDisplay(formatTimeFromDB(day.end_time as Date | null))
        }));
        return NextResponse.json({ schedule: formattedSchedule });
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        return new Response('Ошибка сервера', { status: 500 });
    }
}