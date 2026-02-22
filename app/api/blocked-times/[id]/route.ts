// app/api/blocked-times/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { formatTimeFromDB } from '@/lib/date-utils';

// DELETE /api/blocked-times/[id] - удалить заблокированное время
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const blockedTimeId = parseInt(id);
        
        if (isNaN(blockedTimeId)) {
            return NextResponse.json(
                { success: false, error: 'Неверный ID' },
                { status: 400 }
            );
        }
        
        // Проверяем существование записи
        const existingBlockedTime = await prisma.blocked_times.findUnique({
            where: { id: blockedTimeId }
        });
        
        if (!existingBlockedTime) {
            return NextResponse.json(
                { success: false, error: 'Заблокированное время не найдено' },
                { status: 404 }
            );
        }
        
        // Удаляем запись
        await prisma.blocked_times.delete({
            where: { id: blockedTimeId }
        });
        
        return NextResponse.json({
            success: true,
            message: 'Заблокированное время успешно удалено'
        });
        
    } catch (error) {
        console.error('Error deleting blocked time:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка удаления заблокированного времени' },
            { status: 500 }
        );
    }
}

// GET /api/blocked-times/[id] - получить конкретное заблокированное время
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const blockedTimeId = parseInt(id);
        
        if (isNaN(blockedTimeId)) {
            return NextResponse.json(
                { success: false, error: 'Неверный ID' },
                { status: 400 }
            );
        }
        
        const blockedTime = await prisma.blocked_times.findUnique({
            where: { id: blockedTimeId }
        });
        
        if (!blockedTime) {
            return NextResponse.json(
                { success: false, error: 'Заблокированное время не найдено' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            blockedTime: {
                id: blockedTime.id,
                date: blockedTime.date?.toISOString().split('T')[0] || null,
                start_time: formatTimeFromDB(blockedTime.start_time),
                end_time: formatTimeFromDB(blockedTime.end_time),
                reason: blockedTime.reason
            }
        });
        
    } catch (error) {
        console.error('Error fetching blocked time:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка получения заблокированного времени' },
            { status: 500 }
        );
    }
}