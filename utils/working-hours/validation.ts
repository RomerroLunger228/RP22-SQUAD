/**
 * Утилиты валидации для рабочих часов
 * 
 * Принципы SOLID:
 * - Single Responsibility: только валидация рабочих часов
 * - Open/Closed: легко расширяется новыми правилами валидации
 */

import { WorkingDayForm, WorkingDayValidationErrors } from '@/types/admin';

/**
 * Валидирует один рабочий день
 */
export function validateWorkingDay(day: WorkingDayForm): WorkingDayValidationErrors {
  const errors: WorkingDayValidationErrors = {};

  if (day.is_working) {
    // Валидация времени начала
    if (!day.start_time) {
      errors.start_time = 'Укажите время начала работы';
    } else if (!isValidTimeFormat(day.start_time)) {
      errors.start_time = 'Некорректный формат времени';
    }

    // Валидация времени окончания
    if (!day.end_time) {
      errors.end_time = 'Укажите время окончания работы';
    } else if (!isValidTimeFormat(day.end_time)) {
      errors.end_time = 'Некорректный формат времени';
    }

    // Валидация диапазона времени
    if (day.start_time && day.end_time && isValidTimeFormat(day.start_time) && isValidTimeFormat(day.end_time)) {
      const duration = calculateDurationMinutes(day.start_time, day.end_time);
      
      // Если продолжительность отрицательная, значит работа через полночь
      if (duration <= 0) {
        // Для работы через полночь проверяем что это разумное время (не больше 16 часов)
        const durationThroughMidnight = (24 * 60) + duration; // добавляем сутки
        if (durationThroughMidnight <= 30 || durationThroughMidnight > 16 * 60) {
          errors.timeRange = 'Некорректное время работы через полночь (макс. 16 часов)';
        }
      } else if (duration < 30) {
        errors.timeRange = 'Минимальная продолжительность работы: 30 минут';
      } else if (duration > 16 * 60) {
        errors.timeRange = 'Максимальная продолжительность работы: 16 часов';
      }
    }
  }

  return errors;
}

/**
 * Валидирует массив рабочих дней
 */
export function validateWorkingDays(days: WorkingDayForm[]): Record<number, WorkingDayValidationErrors> {
  const allErrors: Record<number, WorkingDayValidationErrors> = {};
  
  days.forEach(day => {
    const errors = validateWorkingDay(day);
    if (Object.keys(errors).length > 0) {
      allErrors[day.weekday] = errors;
    }
  });

  return allErrors;
}

/**
 * Проверяет есть ли ошибки валидации
 */
export function hasValidationErrors(errors: Record<number, WorkingDayValidationErrors>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Проверяет корректность формата времени (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Вычисляет продолжительность в минутах между двумя временными точками
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
}