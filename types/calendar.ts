// types/calendar.ts

export interface CalendarAppointment {
  id: number;
  appointment_date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'no_show' | 'canceled';
  service: {
    name: string;
    duration_minutes: number;
    pl_price: number;
  };
  payment_method?: string;
  created_at: string;
  user_id: number;
  username?: string; // Добавляем username для отображения
}

export interface CalendarBlockedTime {
  id: number;
  date: string; // YYYY-MM-DD  
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  reason: string;
}

export interface WorkingHours {
  weekday: number; // 1-7
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_working?: boolean; // Рабочий день или выходной
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  workingHours: WorkingHours | null;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  weeks: CalendarWeek[];
}

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  selectedAppointment: CalendarAppointment | null;
  isModalOpen: boolean;
}

export type CalendarView = 'month' | 'week' | 'day';

// Цвета для статусов записей
export const APPOINTMENT_COLORS = {
  pending: 'bg-gradient-to-r from-amber-600 to-amber-500',
  confirmed: 'bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58]',
  completed: 'bg-gradient-to-r from-slate-600 to-slate-500',
  no_show: 'bg-gradient-to-r from-gray-600 to-gray-500 opacity-50',
  canceled: 'bg-gradient-to-r from-red-600 to-red-500'
} as const;

// Цвета для заблокированного времени
export const BLOCKED_TIME_COLOR = 'bg-gradient-to-r from-red-500 to-red-400';