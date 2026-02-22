// components/ui/calendar/hooks/useCalendar.ts

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarState, CalendarAppointment, CalendarBlockedTime, WorkingHours, CalendarMonth } from '@/types/calendar';
import { generateCalendarMonth } from '../utils/calendarUtils';
import { apiClient, createQueryKey } from '@/lib/axios';
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';

interface BlockedTimeFromApi {
  id: number;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface BlockedTimesResponse {
  success: boolean;
  blockedTimes: BlockedTimeFromApi[];
}

interface UseCalendarReturn {
  calendarState: CalendarState;
  calendarMonth: CalendarMonth;
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  workingHours: WorkingHours[];
  loading: boolean;
  error: string | null;
  
  // Actions
  navigateToNextMonth: () => void;
  navigateToPrevMonth: () => void;
  navigateToMonth: (year: number, month: number) => void;
  navigateToToday: () => void;
  selectAppointment: (appointment: CalendarAppointment) => void;
  closeModal: () => void;
  refreshData: () => void;
}

export function useCalendar(): UseCalendarReturn {
  const queryClient = useQueryClient();
  const { invalidateAdminAppointments } = useAppointmentInvalidation();
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    selectedDate: null,
    selectedAppointment: null,
    isModalOpen: false
  });

  // Загрузка записей
  const { 
    data: appointments = [], 
    isLoading: appointmentsLoading 
  } = useQuery({
    queryKey: createQueryKey('appointments', { admin: true }),
    queryFn: async (): Promise<CalendarAppointment[]> => {
      const response = await apiClient.get<CalendarAppointment[]>('/api/appointments?admin=true');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты
  });

  // Загрузка заблокированных времен
  const { 
    data: blockedTimesData, 
    isLoading: blockedTimesLoading 
  } = useQuery({
    queryKey: createQueryKey('blocked-times'),
    queryFn: async (): Promise<BlockedTimesResponse> => {
      const response = await apiClient.get<BlockedTimesResponse>('/api/blocked-times');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Преобразуем заблокированные времена
  const blockedTimes: CalendarBlockedTime[] = blockedTimesData?.success 
    ? blockedTimesData.blockedTimes
        .filter((bt: BlockedTimeFromApi) => bt.date !== null)
        .map((bt: BlockedTimeFromApi) => ({
          id: bt.id,
          date: bt.date as string,
          start_time: bt.start_time?.substring(0, 5) || '00:00',
          end_time: bt.end_time?.substring(0, 5) || '23:59',
          reason: bt.reason || 'Заблокировано'
        }))
    : [];

  // Моковые рабочие часы (можно заменить на реальный API запрос)
  const workingHours: WorkingHours[] = [
    { weekday: 1, start_time: '10:00', end_time: '18:30' }, // Понедельник
    { weekday: 2, start_time: '10:00', end_time: '18:30' }, // Вторник
    { weekday: 3, start_time: '10:00', end_time: '18:30' }, // Среда
    { weekday: 4, start_time: '10:00', end_time: '18:30' }, // Четверг
    { weekday: 5, start_time: '10:00', end_time: '18:30' }, // Пятница
    { weekday: 6, start_time: '10:00', end_time: '16:00' }, // Суббота
    // Воскресенье - выходной
  ];

  const loading = appointmentsLoading || blockedTimesLoading;
  const error = null; // Errors are handled by React Query automatically

  // Генерируем календарную сетку
  const calendarMonth = generateCalendarMonth(
    calendarState.currentDate.getFullYear(),
    calendarState.currentDate.getMonth(),
    appointments,
    blockedTimes,
    workingHours
  );


  // Навигация по месяцам
  const navigateToNextMonth = useCallback(() => {
    setCalendarState(prev => {
      const newDate = new Date(prev.currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return { ...prev, currentDate: newDate };
    });
  }, []);

  const navigateToPrevMonth = useCallback(() => {
    setCalendarState(prev => {
      const newDate = new Date(prev.currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return { ...prev, currentDate: newDate };
    });
  }, []);

  const navigateToMonth = useCallback((year: number, month: number) => {
    setCalendarState(prev => ({
      ...prev,
      currentDate: new Date(year, month, 1)
    }));
  }, []);

  const navigateToToday = useCallback(() => {
    setCalendarState(prev => ({
      ...prev,
      currentDate: new Date()
    }));
  }, []);

  // Выбор записи
  const selectAppointment = useCallback((appointment: CalendarAppointment) => {
    setCalendarState(prev => ({
      ...prev,
      selectedAppointment: appointment,
      isModalOpen: true
    }));
  }, []);

  const closeModal = useCallback(() => {
    setCalendarState(prev => ({
      ...prev,
      selectedAppointment: null,
      isModalOpen: false
    }));
  }, []);

  const refreshData = useCallback(() => {
    // Инвалидируем только админские кэши (календарь в админке)
    invalidateAdminAppointments();
    queryClient.invalidateQueries({ queryKey: createQueryKey('blocked-times') });
  }, [queryClient, invalidateAdminAppointments]);

  return {
    calendarState,
    calendarMonth,
    appointments,
    blockedTimes,
    workingHours,
    loading,
    error,
    navigateToNextMonth,
    navigateToPrevMonth,
    navigateToMonth,
    navigateToToday,
    selectAppointment,
    closeModal,
    refreshData
  };
}