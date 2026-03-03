// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Чистая логика календаря без логов
// 
// ✅ ПРИНЦИПЫ БЕЗОПАСНОСТИ:
// - Никаких логов (не попадут на клиент)
// - Строгая типизация (никаких any)
// - Чистая бизнес-логика
// 
// 🔍 ИЗВЛЕЧЕНО ИЗ: CalendarDatePicker.tsx строки 59-163

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    dateToUTCString, 
    localDateToUTC,
} from "@/lib/date-utils";
import { apiClient } from "@/lib/axios";
import { useWorkingDays } from "@/hooks/useWorkingDays";

// 📝 СТРОГИЕ ТИПЫ - точно такие же как в оригинале
interface BookingData {
    success: boolean;
    workingHours?: {
        id: number;
        weekday: number;
        start_time: string;
        end_time: string;
    };
    appointments?: Array<{
        id: number;
        user_id: number;
        appointment_date: string;
        time: string;
        service_id: number;
        duration_minutes: number;
        created_at: string;
    }>;
    availableSlots?: string[];
    meta?: {
        service: {
            id: number;
            name: string;
            duration_minutes: number;
        };
        date: string;
        dayOfWeek: {
            number: number;
            name: string;
        };
        calculation: {
            slot_interval_minutes: number;
            buffer_minutes: number;
            total_slots_generated: number;
        };
    };
    error?: string;
}

export function useCalendarLogic(serviceId: number) {
    // 📅 СОСТОЯНИЕ ВЫБРАННОЙ ДАТЫ
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const now = new Date();
        return new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));
    });

    // 🏢 ХУК РАБОЧИХ ДНЕЙ
    const { 
        isWorkingDay, 
        isDateConfigured, 
        getWorkingHours, 
        isLoading: workingDaysLoading,
        shouldForceRefresh,
        refetch,
        error: workingDaysError,
        cacheStatus
    } = useWorkingDays();

    // 🔄 ЭФФЕКТЫ ДЛЯ ВОССТАНОВЛЕНИЯ КЭША
    useEffect(() => {
        if (shouldForceRefresh()) {
            refetch();
        }
    }, [shouldForceRefresh, refetch]);

    // 📅 ОБРАБОТЧИК ВЫБОРА ДАТЫ
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const utcDate = localDateToUTC(date);
        setSelectedDate(utcDate);
    };

    // 🔍 ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ
    const selectedDateStr = dateToUTCString(selectedDate);
    const isCurrentDateWorking = workingDaysLoading ? true : isWorkingDay(selectedDateStr);
    const isCurrentDateConfigured = workingDaysLoading ? true : isDateConfigured(selectedDateStr);
    const currentWorkingHours = getWorkingHours(selectedDateStr);

    // 🚀 API ЗАПРОС ДЛЯ СЛОТОВ
    const { data: bookingData, isLoading, error } = useQuery({
        queryKey: ['available-slots', serviceId, selectedDateStr],
        queryFn: async (): Promise<BookingData> => {
            if (!serviceId) {
                throw new Error("Не выбрана услуга");
            }

            if (!currentWorkingHours) {
                throw new Error("Рабочие часы не найдены");
            }

            const response = await apiClient.get(
                `/api/available?serviceId=${serviceId}&date=${selectedDateStr}&slotInterval=30&buffer=15`,
                {
                    headers: {
                        'x-working-hours': JSON.stringify({
                            start_time: currentWorkingHours.start_time,
                            end_time: currentWorkingHours.end_time,
                            is_working: true
                        })
                    }
                }
            );

            const data: BookingData = response.data;

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        },
        enabled: !!serviceId && isCurrentDateWorking && isCurrentDateConfigured && !!currentWorkingHours,
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });

    // 🚫 ЛОГИКА БЛОКИРОВКИ ДАТ
    const isDateDisabled = (date: Date): boolean => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (selectedDateStart < todayStart) return true;
        
        if (!workingDaysLoading) {
            const dateStr = dateToUTCString(date);
            return !isWorkingDay(dateStr);
        }
        
        return false;
    };

    // 🎁 ВОЗВРАЩАЕМ ТИПИЗИРОВАННЫЙ API
    return {
        // Основные данные
        selectedDate,
        bookingData,
        isLoading,
        error,
        
        // Функции
        handleDateSelect,
        isDateDisabled,
        
        // Вычисляемые значения
        selectedDateStr,
        
        // Статусы
        workingDaysLoading,
        isCurrentDateWorking,
        isCurrentDateConfigured,
    } as const;
}

// 📚 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 
// 🔒 БЕЗОПАСНОСТЬ:
// - Никаких логов не попадет в продакшен
// - Строгая типизация предотвращает ошибки
// - Чистая логика без побочных эффектов
// 
// 🎯 ПЕРЕИСПОЛЬЗУЕМОСТЬ:
// - Хук может использоваться в любом календарном компоненте
// - Вся логика изолирована от UI
// - Легко тестировать отдельно