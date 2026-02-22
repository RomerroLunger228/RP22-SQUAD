// components/mobile/MobileDateTimeSelection.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { formatTimeForDisplay, formatDateForAPI } from "@/lib/date-utils";
import { apiClient, createQueryKey } from "@/lib/axios";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useWorkingDays } from "@/hooks/useWorkingDays";

interface AvailableSlotsResponse {
  success: boolean;
  availableSlots?: string[];
  error?: string;
}

interface MobileDateTimeSelectionProps {
  serviceId: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelect: (date: Date, time: string) => void;
  onBack: () => void;
}

export function MobileDateTimeSelection({
  serviceId,
  selectedDate,
  selectedTime,
  onSelect,
  onBack,
}: MobileDateTimeSelectionProps) {
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime);

  // ⚡ Оптимизация: используем кэш рабочих дней
  const { isWorkingDay, getWorkingHours, isLoading: workingDaysLoading } = useWorkingDays();

  // Загружаем доступные слоты с помощью React Query
  const {
    data: slotsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: createQueryKey('available-slots', {
      serviceId,
      date: formatDateForAPI(date),
    }),
    queryFn: async (): Promise<AvailableSlotsResponse> => {
      if (!serviceId) {
        throw new Error("Не выбрана услуга");
      }

      const dateStr = formatDateForAPI(date);

      console.log('Fetching slots for date:', {
        originalDate: date,
        localDateString: date.toLocaleDateString('ru-RU'),
        apiDateString: dateStr,
        getDate: date.getDate(),
        getMonth: date.getMonth(),
        getFullYear: date.getFullYear()
      });

      // ⚡ ОПТИМИЗАЦИЯ: быстрая проверка выходных дней
      if (!workingDaysLoading && !isWorkingDay(dateStr)) {
        console.log('⚡ [MOBILE_SELECTION] Fast exit: non-working day', dateStr);
        return {
          success: true,
          availableSlots: [],
          error: "Выходной день"
        };
      }

      // ⚡ ОПТИМИЗАЦИЯ: передаем рабочие часы в заголовке для ускорения API
      const workingHours = getWorkingHours(dateStr);
      const headers: Record<string, string> = {};
      
      if (workingHours) {
        headers['x-working-hours'] = JSON.stringify({
          start_time: workingHours.start_time,
          end_time: workingHours.end_time,
          is_working: true
        });
        console.log('⚡ [MOBILE_SELECTION] Using cached working hours for', dateStr);
      }

      const response = await apiClient.get(
        `/api/available?serviceId=${serviceId}&date=${dateStr}&slotInterval=30&buffer=15`,
        { headers }
      );

      const data: AvailableSlotsResponse = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    enabled: !!serviceId && !workingDaysLoading, // Ждем загрузки кэша рабочих дней
    staleTime: 2 * 60 * 1000, // 2 минуты
    retry: 2,
  });

  // ✅ ИСПРАВЛЕНИЕ 1: Мемоизируем availableSlots для стабильных зависимостей
  const availableSlots = useMemo(() => {
    return slotsResponse?.availableSlots || [];
  }, [slotsResponse?.availableSlots]);

  // ✅ ИСПРАВЛЕНИЕ 2: Переносим логику сброса в отдельный useEffect без setState
  useEffect(() => {
    // После загрузки новых слотов проверяем, доступно ли выбранное время для новой даты
    if (selectedSlot && availableSlots.length > 0) {
      if (!availableSlots.includes(selectedSlot)) {
        // Планируем сброс на следующий render цикл
        console.log('Сброс выбранного времени: недоступно для новой даты');
        // Используем setTimeout для избежания синхронного setState в effect
        setTimeout(() => {
          setSelectedSlot(null);
        }, 0);
      }
    }
  }, [availableSlots, selectedSlot]); // Добавляем selectedSlot обратно для корректности

  // Проверка, заблокирована ли дата (прошлые даты + более 21 дня)
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ));
    
    const dateUTC = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    
    // Максимальная дата для записи (21 день от сегодня)
    const maxBookingDate = new Date(todayUTC);
    maxBookingDate.setDate(maxBookingDate.getDate() + 21);
    
    // Заблокированы прошлые даты и даты более чем через 21 день
    return dateUTC < todayUTC || dateUTC > maxBookingDate;
  };

  // Форматирование даты для отображения
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedSlot(time);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      onSelect(date, selectedSlot);
    }
  };

  return (
    <div className="px-4 py-3">
      {/* Хедер с кнопкой назад */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white font-montserrat">Выберите время</h1>
            <p className="text-[#BBBDC0] text-sm font-montserrat">Выберите удобную дату и время записи</p>
          </div>
        </div>
      </div>

      {/* Календарь */}
      <div className="mb-6">
        <div className="bg-black rounded-xl p-4 border border-[#222222]">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            disabled={isDateDisabled}
            weekStartsOn={1}
            className="w-full"
            classNames={{
              months: "w-full",
              month: "space-y-3",
              caption: "flex justify-center pt-1 relative items-center mb-2",
              caption_label: "text-white text-base font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 text-white hover:bg-[#222222] rounded-lg",
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              table: "w-full border-collapse",
              head_row: "flex justify-between",
              head_cell: "text-[#888888] text-xs font-normal w-10 text-center",
              row: "flex w-full justify-between mt-1",
              cell: "h-10 w-10 text-center text-sm p-0 relative",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-[#222222] rounded-lg flex items-center justify-center",
              day_selected: "bg-white text-black hover:bg-white hover:text-black font-medium",
              day_today: "border border-[#444444]",
              day_outside: "text-[#555555]",
              day_disabled: "text-[#444444] opacity-40 cursor-not-allowed",
              day_hidden: "invisible"
            }}
          />
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-white font-medium text-lg">
            {formatDateDisplay(date)}
          </p>
        </div>
      </div>

      {/* Доступное время */}
      <div className="bg-[#1A1A1A] rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white font-montserrat">Доступное время</h2>
          {availableSlots.length > 0 && (
            <span className="text-[#BBBDC0] text-sm">
              <span className="font-montserrat">{availableSlots.length} вариантов</span>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
            <p className="text-[#BBBDC0] font-montserrat">Загружаем доступное время...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="text-[#BBBDC0] mb-2">⚠️</div>
            <p className="text-[#BBBDC0] font-montserrat">
              {error instanceof Error ? error.message : "Не удалось загрузить доступное время"}
            </p>
            <p className="text-[#888888] text-sm mt-1 font-montserrat">
              Попробуйте выбрать другую дату
            </p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-[#555555] text-3xl mb-2">⏰</div>
            <p className="text-[#BBBDC0] font-montserrat">Нет доступного времени</p>
            <p className="text-[#888888] text-sm mt-1 font-montserrat">
              На эту дату все время занято
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSelect(slot)}
                className={`py-3 rounded-lg transition-all duration-200 ${
                  selectedSlot === slot
                    ? "bg-white text-black"
                    : "bg-[#2A2A2A] text-white hover:bg-[#333333]"
                }`}
              >
                <span className="font-medium">{formatTimeForDisplay(slot)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка подтверждения */}
      {selectedSlot && availableSlots.includes(selectedSlot) && (
        <div className="mt-6">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200"
          >
            <span className="font-montserrat">Подтвердить время</span>
          </button>
          
          <div className="mt-3 text-center">
            <p className="text-[#BBBDC0] text-sm font-montserrat">
              Выбрано: {formatDateDisplay(date)} в {formatTimeForDisplay(selectedSlot)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}