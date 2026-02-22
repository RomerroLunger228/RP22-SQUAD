// components/CalendarDatePicker.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { 
    dateToUTCString, 
    localDateToUTC, 
    formatTimeForDisplay 
} from "@/lib/date-utils";
import { apiClient } from "@/lib/axios";
import { useWorkingDays } from "@/hooks/useWorkingDays";

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

interface CalendarDatePickerProps {
    serviceId: number;
    onSlotSelect?: (slot: string) => void;
}

export function CalendarDatePicker({ serviceId, onSlotSelect }: CalendarDatePickerProps) {
    // Начальная дата - сегодня в UTC
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const now = new Date();
        return new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));
    });

    // ⚡ Хук для быстрой проверки рабочих дней
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

    // 🔧 Автоматическое восстановление при проблемах с кешем
    useEffect(() => {
        if (shouldForceRefresh()) {
            console.warn('🔄 [CALENDAR_PICKER] Cache is stale and has errors, forcing refresh');
            refetch();
        }
    }, [shouldForceRefresh, refetch]);

    // 🔍 Мониторинг состояния кеша для отладки
    useEffect(() => {
        if (workingDaysError && !workingDaysLoading) {
            console.error('📊 [CALENDAR_PICKER] Working days cache status:', {
                error: workingDaysError?.message,
                cacheStatus,
                timestamp: new Date().toISOString()
            });
        }
    }, [workingDaysError, workingDaysLoading, cacheStatus]);
    

    // Обработчик выбора даты в календаре
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        
        // Преобразуем локальную дату в UTC
        const utcDate = localDateToUTC(date);
        setSelectedDate(utcDate);
    };

    const selectedDateStr = dateToUTCString(selectedDate);

    // ⚡ Быстрая проверка: если день не рабочий - не делаем запрос к API
    const isCurrentDateWorking = workingDaysLoading ? true : isWorkingDay(selectedDateStr);
    const isCurrentDateConfigured = workingDaysLoading ? true : isDateConfigured(selectedDateStr);

    // ⚡ Получаем рабочие часы для текущей даты
    const currentWorkingHours = getWorkingHours(selectedDateStr);

    const { data: bookingData, isLoading, error } = useQuery({
        queryKey: ['available-slots', serviceId, selectedDateStr],
        queryFn: async () => {
            if (!serviceId) {
                throw new Error("Не выбрана услуга");
            }

            if (!currentWorkingHours) {
                throw new Error("Рабочие часы не найдены");
            }

            console.log("📡 Запрос к API:", {
                serviceId,
                date: selectedDateStr,
                workingHours: currentWorkingHours,
                selectedDateUTC: selectedDate.toISOString()
            });

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

            console.log("📊 Данные от API:", response.data);

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

    // ⚡ Улучшенная проверка заблокированных дат
    const isDateDisabled = (date: Date) => {
        // Создаем даты для сравнения без времени
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Отключаем даты раньше сегодня
        if (selectedDateStart < todayStart) return true;
        
        // ⚡ Быстрая проверка через кеш: если данные загружены и день не рабочий
        if (!workingDaysLoading) {
            const dateStr = dateToUTCString(date);
            return !isWorkingDay(dateStr);
        }
        
        return false;
    };

    // Обработчик выбора слота времени
    const handleSlotSelect = (slot: string) => {
        console.log("🎯 Выбран слот:", slot);
        if (onSlotSelect) {
            onSlotSelect(slot);
        }
    };

    return (
        <div className="bg-[#000000] rounded-[16px] p-4 md:p-6 space-y-6">
            {/* Заголовок */}
            <div>
                <h3 className="text-[20px] md:text-[22px] font-medium text-white mb-2">
                    <span className="font-montserrat">Выберите дату записи</span>
                </h3>
                <p className="text-[#BBBDC0] text-sm font-montserrat">
                    {selectedDate && `Выбрано: ${dateToUTCString(selectedDate)}`}
                </p>
            </div>

            <div className="bg-[#111111] rounded-xl">
  <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={handleDateSelect}
    disabled={isDateDisabled}
    weekStartsOn={1}
    className="w-full"
    classNames={{
      // Можно оставить только для добавления классов, не для переопределения layout
      day: "custom-day-class",
      day_selected: "custom-selected-class",
    }}
  />
</div>

            {/* Состояние загрузки */}
            {isLoading && (
                <div className="bg-[#111111] rounded-[12px] p-6 text-center">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#7CB895] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[#BBBDC0] font-montserrat">Ищем доступное время...</span>
                    </div>
                </div>
            )}

            {/* Ошибка */}
            {error && !isLoading && (
                <div className="bg-[#331111] border border-red-500/30 rounded-[12px] p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-red-400 text-lg">⚠️</div>
                        <div>
                            <h4 className="text-red-300 font-medium mb-1 font-montserrat">Не удалось загрузить данные</h4>
                            <p className="text-red-200/80 text-sm">{error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Данные о бронировании */}
            {bookingData && !isLoading && !error && (
                <div className="space-y-4">
                    {/* Информация об услуге */}
                    {bookingData.meta?.service && (
                        <div className="bg-[#111111] rounded-[12px] p-4">
                            <h4 className="text-white font-medium mb-2 font-montserrat">Выбранная услуга</h4>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-white text-sm">{bookingData.meta.service.name}</p>
                                    <p className="text-[#BBBDC0] text-xs font-montserrat">
                                        Длительность: {bookingData.meta.service.duration_minutes} мин
                                    </p>
                                </div>
                                <div className="text-[#7CB895] text-sm font-medium">
                                    ID: {bookingData.meta.service.id}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Рабочее время */}
                    {bookingData.workingHours && (
                        <div className="bg-[#111111] rounded-[12px] p-4">
                            <h4 className="text-white font-medium mb-2 font-montserrat">Рабочее время</h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-white">
                                        {formatTimeForDisplay(bookingData.workingHours.start_time)}
                                    </span>
                                </div>
                                <span className="text-[#BBBDC0]">—</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-white">
                                        {formatTimeForDisplay(bookingData.workingHours.end_time)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Занятые слоты */}
                    {bookingData.appointments && bookingData.appointments.length > 0 && (
                        <div className="bg-[#111111] rounded-[12px] p-4">
                            <h4 className="text-white font-medium mb-3 font-montserrat">Занятое время</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {bookingData.appointments.map((appointment) => (
                                    <div 
                                        key={appointment.id}
                                        className="bg-[#222222] rounded-[8px] p-3"
                                    >
                                        <div className="text-white text-sm font-medium mb-1">
                                            {formatTimeForDisplay(appointment.time)}
                                        </div>
                                        <div className="text-[#BBBDC0] text-xs font-montserrat">
                                            {appointment.duration_minutes} мин
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Доступные слоты */}
                    <div className="bg-[#111111] rounded-[12px] p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-white font-medium font-montserrat">Доступное время</h4>
                            {bookingData.availableSlots && (
                                <span className="text-[#7CB895] text-sm font-montserrat">
                                    {bookingData.availableSlots.length} слотов
                                </span>
                            )}
                        </div>

                        {bookingData.availableSlots && bookingData.availableSlots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {bookingData.availableSlots.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSlotSelect(slot)}
                                        className="bg-[#7CB895] text-white rounded-[8px] py-3 px-2 hover:bg-[#6CA885] active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7CB895] focus:ring-opacity-50"
                                    >
                                        <span className="font-medium">{formatTimeForDisplay(slot)}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="text-[#555555] text-4xl mb-2">😕</div>
                                <p className="text-[#BBBDC0] font-montserrat">Нет доступного времени на эту дату</p>
                                <p className="text-[#888888] text-sm mt-1 font-montserrat">
                                    Попробуйте выбрать другую дату
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Дебаг информация (только в development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="bg-[#111111] rounded-[12px] overflow-hidden">
                            <summary className="cursor-pointer p-4 text-[#BBBDC0] text-sm hover:text-white transition-colors">
                                <span className="font-montserrat">🔍 Показать техническую информацию</span>
                            </summary>
                            <div className="p-4 border-t border-[#222222]">
                                <pre className="text-xs text-white bg-[#222222] p-3 rounded-[8px] overflow-auto max-h-64">
                                    {JSON.stringify(bookingData, null, 2)}
                                </pre>
                                <div className="mt-3 text-xs text-[#888888] space-y-1">
                                    <div className="font-montserrat">Выбрана дата: {dateToUTCString(selectedDate)}</div>
                                    <div>UTC время: {selectedDate.toISOString()}</div>
                                    <div>Service ID: {serviceId}</div>
                                </div>
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}