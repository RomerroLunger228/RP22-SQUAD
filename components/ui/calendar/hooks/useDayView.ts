// components/ui/calendar/hooks/useDayView.ts

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarAppointment, CalendarBlockedTime, WorkingHours } from '@/types/calendar';
import { apiClient, createQueryKey } from '@/lib/axios';
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';
import { formatDateForAPI } from '@/lib/date-utils';

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

interface WorkingHourFromApi {
  weekday: number;
  start_time: string | null;
  end_time: string | null;
  is_working: boolean;
}

interface WorkDayResponse {
  success: boolean;
  data: WorkingHourFromApi | null;
}

interface DayData {
  date: Date;
  dateString: string;
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  workingHours: WorkingHours | null;
  isToday: boolean;
  isWorkingDay: boolean;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
}

interface UseDayViewReturn {
  selectedDate: Date;
  dayData: DayData;
  weekDays: WeekDay[];
  loading: boolean;
  error: string | null;
  
  // Actions
  selectDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateToNextWeek: () => void;
  navigateToPrevWeek: () => void;
  selectAppointment: (appointment: CalendarAppointment) => void;
  refreshData: () => void;
  
  // Modal state
  selectedAppointment: CalendarAppointment | null;
  isModalOpen: boolean;
  closeModal: () => void;
  
  // Admin booking modal state
  isAdminBookingModalOpen: boolean;
  openAdminBookingModal: () => void;
  closeAdminBookingModal: () => void;
}

export function useDayView(): UseDayViewReturn {
  const queryClient = useQueryClient();
  const { invalidateAdminAppointments } = useAppointmentInvalidation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminBookingModalOpen, setIsAdminBookingModalOpen] = useState(false);

  // Используем стандартную утилиту форматирования даты
  const getDateString = useCallback((date: Date) => formatDateForAPI(date), []);

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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });

  // Загрузка рабочих часов для конкретной даты
  const { 
    data: workingHoursData, 
    isLoading: workingHoursLoading 
  } = useQuery({
    queryKey: createQueryKey('work-day', { date: getDateString(selectedDate) }),
    queryFn: async (): Promise<WorkDayResponse> => {
      const dateString = getDateString(selectedDate);
      const response = await apiClient.get<WorkDayResponse>(`/api/work-days?date=${dateString}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
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

  // Преобразуем рабочие часы (из нового API work-days)
  const workingHours: WorkingHours[] = workingHoursData?.success && workingHoursData.data 
    ? [{
        weekday: selectedDate.getDay() === 0 ? 7 : selectedDate.getDay(),
        start_time: workingHoursData.data.start_time || '00:00',
        end_time: workingHoursData.data.end_time || '23:59',
        is_working: workingHoursData.data.is_working
      }]
    : [];

  const loading = appointmentsLoading || blockedTimesLoading || workingHoursLoading;
  const error = null; // Errors are handled by React Query automatically

  // Получаем данные для выбранного дня
  const selectedDateString = getDateString(selectedDate);
  const filteredAppointments = appointments.filter(apt => 
    apt.appointment_date === selectedDateString &&
    ['pending', 'confirmed', 'completed', 'no_show'].includes(apt.status)
  ).sort((a, b) => a.time.localeCompare(b.time));


  const dayData: DayData = {
    date: selectedDate,
    dateString: selectedDateString,
    appointments: filteredAppointments,
    blockedTimes: blockedTimes.filter(bt => 
      bt.date === selectedDateString
    ),
    workingHours: workingHours.length > 0 ? workingHours[0] : null,
    isToday: selectedDateString === getDateString(new Date()),
    isWorkingDay: workingHours.length > 0 && workingHours[0]?.is_working === true
  };

  // Получаем дни текущей недели
  const weekDays: WeekDay[] = (() => {
    const days: WeekDay[] = [];
    const today = new Date();
    const currentWeekStart = new Date(selectedDate);
    
    // Находим понедельник текущей недели
    const dayOfWeek = currentWeekStart.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract);
    
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      
      days.push({
        date: new Date(day),
        dayName: dayNames[i],
        dayNumber: day.getDate(),
        isToday: getDateString(day) === getDateString(today),
        isSelected: getDateString(day) === getDateString(selectedDate)
      });
    }
    
    return days;
  })();


  // Actions
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(new Date(date));
  }, []);

  const navigateToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const navigateToNextWeek = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  const navigateToPrevWeek = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const selectAppointment = useCallback((appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  }, []);

  const openAdminBookingModal = useCallback(() => {
    setIsAdminBookingModalOpen(true);
  }, []);

  const closeAdminBookingModal = useCallback(() => {
    setIsAdminBookingModalOpen(false);
  }, []);

  const refreshData = useCallback(() => {
    // Инвалидируем только админские кэши (календарь в админке)
    invalidateAdminAppointments();
    queryClient.invalidateQueries({ queryKey: createQueryKey('blocked-times') });
    queryClient.invalidateQueries({ queryKey: createQueryKey('work-day') });
  }, [queryClient, invalidateAdminAppointments]);

  return {
    selectedDate,
    dayData,
    weekDays,
    loading,
    error,
    selectDate,
    navigateToToday,
    navigateToNextWeek,
    navigateToPrevWeek,
    selectAppointment,
    refreshData,
    selectedAppointment,
    isModalOpen,
    closeModal,
    isAdminBookingModalOpen,
    openAdminBookingModal,
    closeAdminBookingModal
  };
}