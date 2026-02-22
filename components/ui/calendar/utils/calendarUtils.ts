// components/ui/calendar/utils/calendarUtils.ts

import { CalendarDay, CalendarWeek, CalendarMonth, CalendarAppointment, CalendarBlockedTime, WorkingHours } from '@/types/calendar';

/**
 * Получить дни месяца для календарной сетки
 * Включает дни из предыдущего и следующего месяца для полной сетки 6х7
 */
export function generateCalendarMonth(
  year: number, 
  month: number, // 0-11
  appointments: CalendarAppointment[] = [],
  blockedTimes: CalendarBlockedTime[] = [],
  workingHours: WorkingHours[] = []
): CalendarMonth {
  const weeks: CalendarWeek[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Начинаем с понедельника (1) instead of Sunday (0)
  const startDate = new Date(firstDayOfMonth);
  const dayOfWeek = firstDayOfMonth.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Если воскресенье, то 6 дней назад
  startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(startDate);
  
  // Генерируем 6 недель для календарной сетки
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    
    for (let day = 0; day < 7; day++) {
      const dateString = formatDateString(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      
      // Фильтруем записи для этого дня
      const dayAppointments = appointments.filter(apt => 
        apt.appointment_date === dateString &&
        ['pending', 'confirmed', 'completed'].includes(apt.status)
      ).sort((a, b) => a.time.localeCompare(b.time));
      
      // Фильтруем заблокированные времена для этого дня
      const dayBlockedTimes = blockedTimes.filter(bt => 
        bt.date === dateString
      );
      
      // Находим рабочие часы для дня недели (1=Пн, 7=Вс)
      const weekdayNumber = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      const dayWorkingHours = workingHours.find(wh => wh.weekday === weekdayNumber) || null;
      
      days.push({
        date: new Date(currentDate),
        dateString,
        isCurrentMonth,
        isToday,
        appointments: dayAppointments,
        blockedTimes: dayBlockedTimes,
        workingHours: dayWorkingHours
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push({ days });
  }
  
  return { year, month, weeks };
}

/**
 * Форматировать дату в строку YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Получить название месяца
 */
export function getMonthName(month: number): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[month];
}

/**
 * Получить сокращенные названия дней недели
 */
export function getWeekdayNames(): string[] {
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
}

/**
 * Проверить, работает ли мастер в этот день
 */
export function isWorkingDay(day: CalendarDay): boolean {
  return day.workingHours !== null;
}

/**
 * Получить отображаемое время для записи
 */
export function formatAppointmentTime(appointment: CalendarAppointment): string {
  return appointment.time; // Уже в формате HH:MM
}

/**
 * Получить общую длительность рабочего дня в минутах
 */
export function getWorkingDayDuration(workingHours: WorkingHours): number {
  const start = timeToMinutes(workingHours.start_time);
  const end = timeToMinutes(workingHours.end_time);
  return end - start;
}

/**
 * Конвертировать время HH:MM в минуты
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}