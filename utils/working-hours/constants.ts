/**
 * Константы для работы с рабочими часами
 */

export const WEEKDAY_NAMES = {
  1: 'Понедельник',
  2: 'Вторник', 
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье'
} as const;

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 7] as const; // Порядок отображения

export const DEFAULT_WORKING_HOURS = {
  START: '09:00',
  END: '18:00'
} as const;

export const WORKING_WEEKDAYS = [1, 2, 3, 4, 5]; // Пн-Пт (остается то же)