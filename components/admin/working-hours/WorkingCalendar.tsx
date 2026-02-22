/**
 * Компонент календаря для управления рабочими днями
 * 
 * АРХИТЕКТУРА:
 * - Использует shadcn/ui Calendar
 * - При клике на дату открывает модалку настройки
 * - Отображает статус дней (рабочий/выходной/не настроен)
 * - Сохранение происходит в модалке
 */

"use client";

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, createQueryKey } from '@/lib/axios';
import { WorkDayModal } from './WorkDayModal';
import { formatDateForAPI } from '@/lib/date-utils';

interface WorkDay {
  id?: number;
  date: string;
  is_working: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

interface WorkingCalendarProps {
  className?: string;
}

export const WorkingCalendar: React.FC<WorkingCalendarProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Загружаем все настроенные рабочие дни
  const { data: workDaysData, isLoading } = useQuery({
    queryKey: createQueryKey('work-days-all'),
    queryFn: async () => {
      const response = await apiClient.get('/api/work-days/all');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты
  });

  // Преобразуем данные в Map для удобства
  const workDays = new Map<string, WorkDay>();
  if (workDaysData?.success && workDaysData?.data) {
    workDaysData.data.forEach((workDay: WorkDay) => {
      workDays.set(workDay.date, workDay);
    });
  }


  // Мутация для сохранения рабочего дня
  const saveWorkDayMutation = useMutation({
    mutationFn: async (workDay: WorkDay) => {
      if (workDay.id) {
        // Обновляем существующий день
        const response = await apiClient.patch(`/api/work-days/${workDay.id}`, workDay);
        return response.data;
      } else {
        // Создаем новый день
        const response = await apiClient.post('/api/work-days', workDay);
        return response.data;
      }
    },
    onSuccess: () => {
      // Перезагружаем все рабочие дни
      queryClient.invalidateQueries({ queryKey: createQueryKey('work-days-all') });
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error('Ошибка при сохранении рабочего дня:', error);
    }
  });

  // Обработчик клика по дате
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Функция для сохранения рабочего дня
  const handleSaveWorkDay = async (workDay: WorkDay) => {
    const existingWorkDay = workDays.get(workDay.date);
    const workDayWithId = existingWorkDay?.id ? { ...workDay, id: existingWorkDay.id } : workDay;
    
    saveWorkDayMutation.mutate(workDayWithId);
  };

  // Функция для определения модификаторов дат в календаре
  const getDateModifiers = () => {
    const modifiers: {
      working: Date[];
      nonWorking: Date[];
      configured: Date[];
    } = {
      working: [],
      nonWorking: [],
      configured: []
    };

    workDays.forEach((workDay, dateString) => {
      const date = new Date(dateString);
      modifiers.configured.push(date);
      
      if (workDay.is_working) {
        modifiers.working.push(date);
      } else {
        modifiers.nonWorking.push(date);
      }
    });

    return modifiers;
  };

  const modifiers = getDateModifiers();

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-montserrat font-semibold text-white mb-2">
              Рабочий календарь
            </h2>
            <p className="text-[#BBBDC0] text-sm font-montserrat">
              Загрузка календаря...
            </p>
          </div>
          <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-xl p-8 shadow-md flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h2 className="text-xl font-montserrat font-semibold text-white mb-2">
            Рабочий календарь
          </h2>
          <p className="text-[#BBBDC0] text-sm font-montserrat">
            Кликните на дату чтобы настроить рабочий день
          </p>
        </div>

        {/* Легенда */}
        <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-xl p-4 shadow-md">
          <div className="flex flex-wrap gap-4 text-sm font-montserrat">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-[#BBBDC0]">Рабочий день</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-[#BBBDC0]">Выходной</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-[#BBBDC0]">Не настроен</span>
            </div>
          </div>
        </div>

        {/* Календарь */}
        <div className="bg-black rounded-xl p-4 border border-[#222222]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersClassNames={{
              working: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
              nonWorking: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
              configured: "font-semibold"
            }}
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
      </div>

      {/* Модалка настройки дня */}
      {selectedDate && (
        <WorkDayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          initialData={workDays.get(formatDateForAPI(selectedDate))}
          onSave={handleSaveWorkDay}
        />
      )}
    </div>
  );
};