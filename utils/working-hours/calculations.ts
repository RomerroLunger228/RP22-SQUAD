/**
 * Утилиты вычислений для рабочих часов
 * 
 * Принципы SOLID:
 * - Single Responsibility: только математические вычисления
 * - Pure Functions: без побочных эффектов
 */

import { WorkingDayForm } from '@/types/admin';

/**
 * Вычисляет продолжительность рабочего дня в человекочитаемом формате
 */
export function calculateDurationText(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '';
  
  let durationMinutes = calculateDurationMinutes(startTime, endTime);
  
  // Если отрицательная продолжительность - работа через полночь
  if (durationMinutes <= 0) {
    durationMinutes = (24 * 60) + durationMinutes;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${minutes} мин`;
}

/**
 * Вычисляет общее количество рабочих часов в неделю
 */
export function calculateWeeklyHours(workingDays: WorkingDayForm[]): number {
  return workingDays
    .filter(day => day.is_working && day.start_time && day.end_time)
    .reduce((total, day) => {
      let durationMinutes = calculateDurationMinutes(day.start_time, day.end_time);
      
      // Если отрицательная продолжительность - работа через полночь
      if (durationMinutes <= 0) {
        durationMinutes = (24 * 60) + durationMinutes;
      }
      
      return total + (durationMinutes / 60);
    }, 0);
}

/**
 * Подсчитывает количество рабочих дней
 */
export function countWorkingDays(workingDays: WorkingDayForm[]): number {
  return workingDays.filter(day => day.is_working).length;
}

/**
 * Подсчитывает количество выходных дней
 */
export function countWeekendDays(workingDays: WorkingDayForm[]): number {
  return workingDays.filter(day => !day.is_working).length;
}

/**
 * Вычисляет среднее количество часов в день
 */
export function calculateAverageHoursPerDay(workingDays: WorkingDayForm[]): number {
  const totalHours = calculateWeeklyHours(workingDays);
  return Math.round(totalHours / 7 * 10) / 10;
}

/**
 * Вычисляет продолжительность в минутах между двумя временными точками
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
}