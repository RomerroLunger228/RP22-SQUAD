// app/api/available/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from 'next/server';
import { 
    calculateOptimalSlots
} from "@/lib/booking-utils";
import { 
    formatTimeFromDB
} from "@/lib/date-utils";
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';



/**
 * 🛡️ БЕЗОПАСНАЯ ФУНКЦИЯ СОЗДАНИЯ ВРЕМЕНИ ИЗ СТРОКИ
 * Проверяет формат и создает валидный Date объект
 */
function createSafeTimeFromString(timeStr: string | null, context: string = ''): Date | null {
    if (!timeStr) {
        console.warn(`⚠️ [TIME_PARSER] Empty time string for ${context}`);
        return null;
    }
    
    try {
        // Проверяем базовый формат HH:MM
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeStr)) {
            throw new Error(`Invalid time format: ${timeStr} (expected HH:MM)`);
        }
        
        const date = new Date(`2000-01-01T${timeStr}:00.000Z`);
        
        // Проверяем что Date валиден
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date created from time: ${timeStr}`);
        }
        
        return date;
    } catch (error) {
        console.error(`💥 [TIME_PARSER] Failed to parse time "${timeStr}" for ${context}:`, error);
        return null;
    }
}


interface AppointmentWithService {
  id: number;
  user_id: number | null;
  appointment_date: Date;
  time: unknown;
  service_id: number | null;
  created_at: Date | null;
  services: {
    duration_minutes: number;
  };
}


/**
 * MAIN API ENDPOINT
 * GET /api/available?serviceId=3&date=2025-12-11
 * Использует новый алгоритм оптимального заполнения с буфером 5 минут
 */
export async function GET(request: NextRequest): Promise<Response> {
    
    try {
        // ✅ JWT авторизация без DB запроса
        const userId = await getCurrentUserId(request);
        
        if (!userId) {
            return createUnauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get("serviceId");
        const dateStr = searchParams.get("date");
        const slotInterval = parseInt(searchParams.get("slotInterval") || "5");
        const bufferMinutes = parseInt(searchParams.get("buffer") || "5");


        // Валидация
        if (!serviceId || !dateStr) {
            return Response.json(
                { success: false, error: "Не указаны serviceId или date" },
                { status: 400 }
            );
        }

        // Преобразуем строку даты в UTC Date
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)); // полдень UTC



        if (isNaN(date.getTime())) {
            return Response.json(
                { success: false, error: "Неверный формат даты. Используйте YYYY-MM-DD" },
                { status: 400 }
            );
        }

        // Получаем услугу
        const service = await prisma.services.findUnique({
            where: { id: parseInt(serviceId) },
            select: { 
                duration_minutes: true,
                name: true,
                id: true
            }
        });
        
        if (!service) {
            return Response.json(
                { success: false, error: "Услуга не найдена" },
                { status: 404 }
            );
        }

        const serviceDuration = service.duration_minutes;

        


        // 🚀 ОПТИМИЗИРОВАННАЯ логика: сначала проверяем рабочее время
        let workingHours = null;
        let dataSource = 'unknown';
        
        const workingHoursHeader = request.headers.get('x-working-hours');
        
        if (workingHoursHeader) {
            try {
                console.log(`🔍 [AVAILABLE_API] Parsing working hours from header for date ${dateStr}`);
                const workingHoursData = JSON.parse(workingHoursHeader);
                
                // 🛡️ Валидация и безопасное создание времени
                const safeStartTime = createSafeTimeFromString(workingHoursData.start_time, `start_time for ${dateStr}`);
                const safeEndTime = createSafeTimeFromString(workingHoursData.end_time, `end_time for ${dateStr}`);
                
                if (safeStartTime && safeEndTime) {
                    workingHours = {
                        id: workingHoursData.id || 0,
                        weekday: workingHoursData.weekday || 1,
                        start_time: safeStartTime,
                        end_time: safeEndTime,
                        is_working: true // Всегда true если запись существует
                    };
                    dataSource = 'frontend_cache';
                    console.log(`✅ [AVAILABLE_API] Successfully used cached working hours for ${dateStr} (${workingHoursData.start_time}-${workingHoursData.end_time})`);
                } else {
                    throw new Error(`Invalid working hours time format - start_time: ${workingHoursData.start_time}, end_time: ${workingHoursData.end_time}`);
                }
            } catch (parseError) {
                console.warn(`⚠️ [AVAILABLE_API] Failed to parse working hours header for ${dateStr}:`, parseError);
                workingHours = null; // Триггерим fallback
            }
        }

        // 🚨 FALLBACK: DB запрос только если заголовок отсутствует
        if (!workingHours) {
            console.log(`🔄 [AVAILABLE_API] Using DB fallback for working hours on ${dateStr}`);
            try {
                const dbWorkingHours = await prisma.master_settings.findFirst({
                    where: { 
                        date: new Date(dateStr + 'T12:00:00Z')
                    }
                });
                
                if (dbWorkingHours) {
                    workingHours = {
                        ...dbWorkingHours,
                        is_working: true // Если запись существует = рабочий день
                    };
                    dataSource = 'database_fallback';
                    console.log(`✅ [AVAILABLE_API] DB fallback successful for ${dateStr}`);
                } else {
                    console.log(`❌ [AVAILABLE_API] No working hours found in DB for ${dateStr} - считается выходным`);
                }
            } catch (dbError) {
                console.error(`💥 [AVAILABLE_API] DB fallback failed for ${dateStr}:`, dbError);
            }
        }


        // ⚡ РАННИЙ возврат для выходных дней (оптимизация)
        if (!workingHours) {
            return Response.json({
                success: true,
                error: "Выходной день",
                workingHours: null,
                appointments: [],
                availableSlots: [],
                meta: {
                    service: {
                        id: service.id,
                        name: service.name,
                        duration_minutes: serviceDuration
                    },
                    date: dateStr,
                    isConfigured: false,
                    dataSource
                }
            }, { status: 200 });
        }

        // Форматируем рабочее время
        const workStart = formatTimeFromDB(workingHours.start_time);
        const workEnd = formatTimeFromDB(workingHours.end_time) || "18:00:00";
        
        if (!workStart) {
            return Response.json({
                success: false,
                error: "Ошибка в настройках рабочего времени"
            }, { status: 500 });
        }

        // 🚀 ЗАГРУЖАЕМ записи только для рабочих дней
        const existingAppointments = await prisma.appointments.findMany({
            where: {
                appointment_date: date,
                status: { in: ['confirmed', 'pending'] }
            },
            include: {
                services: {
                    select: { duration_minutes: true }
                }
            },
            orderBy: { time: 'asc' }
        });

        // Подготавливаем записи для расчета
        const formattedAppointments = existingAppointments
            .filter((app: AppointmentWithService) => app.time)
            .map((app: AppointmentWithService) => ({
                time: formatTimeFromDB(app.time as Date | null)!,
                duration: app.services.duration_minutes
            }));

        // Рассчитываем доступные слоты БЕЗ blocked_times
        const availableSlots = calculateOptimalSlots(
            workStart,
            workEnd,
            formattedAppointments,
            serviceDuration,
            bufferMinutes,
            slotInterval,
            [] // Больше не используем blocked_times
        );


        // Формируем ответ
        const response = {
            success: true,
            workingHours: {
                id: workingHours.id,
                weekday: workingHours.weekday,
                start_time: workStart,
                end_time: workEnd
            },
            appointments: existingAppointments.map((app: AppointmentWithService) => ({
                id: app.id,
                user_id: app.user_id,
                appointment_date: app.appointment_date.toISOString().split('T')[0],
                time: formatTimeFromDB(app.time as Date | null),
                service_id: app.service_id,
                duration_minutes: app.services.duration_minutes,
                created_at: app.created_at?.toISOString() || null
            })),
            availableSlots,
            meta: {
                service: {
                    id: service.id,
                    name: service.name,
                    duration_minutes: serviceDuration
                },
                date: dateStr,
                calculation: {
                    algorithm: "optimal_packing",
                    buffer_minutes: bufferMinutes,
                    step_minutes: slotInterval,
                    total_slots_found: availableSlots.length,
                    blocked_times_count: 0
                },
                dataSource // 🔍 Отслеживаем источник данных
            }
        };


        return Response.json(response, { status: 200 });
        
    } catch (error) {
        console.error("💥 API Error:", error);
        
        return Response.json({
            success: false,
            error: "Внутренняя ошибка сервера",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}