/**
 * Утилиты валидации для админки
 * 
 * ЛОГИКА ВАЛИДАЦИИ:
 * - Клиентская валидация для UX (быстрая обратная связь)
 * - Серверная валидация остается обязательной для безопасности
 * - Понятные сообщения об ошибках на русском языке
 * - Модульная структура для переиспользования
 */

import { NewBlockedTimeForm, BlockedTimeValidationErrors } from '@/types/admin';

/**
 * Валидирует форму заблокированного времени
 * 
 * ЛОГИКА ПРОВЕРОК:
 * 1. Обязательные поля (дата, время начала, время окончания)
 * 2. Дата не в прошлом (нельзя блокировать прошедшее время)
 * 3. Время окончания больше времени начала
 * 4. Разумные ограничения на временные интервалы
 * 
 * @param form - данные формы
 * @returns объект с ошибками валидации (пустой если ошибок нет)
 */
export function validateBlockedTimeForm(form: NewBlockedTimeForm): BlockedTimeValidationErrors {
  const errors: BlockedTimeValidationErrors = {};
  
  // Валидация даты
  if (!form.date.trim()) {
    errors.date = 'Обязательное поле';
  } else {
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сбрасываем время для корректного сравнения дат
    
    if (isNaN(selectedDate.getTime())) {
      errors.date = 'Некорректный формат даты';
    } else if (selectedDate < today) {
      errors.date = 'Нельзя заблокировать прошедшую дату';
    }
  }
  
  // Валидация времени начала
  if (!form.start_time.trim()) {
    errors.start_time = 'Обязательное поле';
  } else if (!isValidTimeFormat(form.start_time)) {
    errors.start_time = 'Некорректный формат времени';
  }
  
  // Валидация времени окончания
  if (!form.end_time.trim()) {
    errors.end_time = 'Обязательное поле';
  } else if (!isValidTimeFormat(form.end_time)) {
    errors.end_time = 'Некорректный формат времени';
  }
  
  // Валидация диапазона времени
  if (form.start_time && form.end_time && !errors.start_time && !errors.end_time) {
    if (!isValidTimeRange(form.start_time, form.end_time)) {
      errors.timeRange = 'Время окончания должно быть больше времени начала';
    } else if (!isReasonableTimeRange(form.start_time, form.end_time)) {
      errors.timeRange = 'Слишком длинный период блокировки (максимум 12 часов)';
    }
  }
  
  return errors;
}

/**
 * Проверяет корректность формата времени
 * 
 * ЛОГИКА ФОРМАТА:
 * - Ожидаем HH:MM формат от HTML time input
 * - Проверяем что часы 00-23, минуты 00-59
 * - Регулярное выражение для точной проверки
 * 
 * @param timeStr - строка времени
 * @returns true если формат корректный
 */
export function isValidTimeFormat(timeStr: string): boolean {
  // Проверяем формат HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Проверяет что время окончания больше времени начала
 * 
 * ЛОГИКА СРАВНЕНИЯ:
 * - Преобразуем время в минуты от начала дня
 * - Простое числовое сравнение
 * - Не позволяем нулевую продолжительность
 * 
 * @param startTime - время начала в формате HH:MM
 * @param endTime - время окончания в формате HH:MM
 * @returns true если диапазон корректный
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Время окончания должно быть строго больше времени начала
  return endMinutes > startMinutes;
}

/**
 * Проверяет разумность временного диапазона
 * 
 * ЛОГИКА ОГРАНИЧЕНИЙ:
 * - Максимум 12 часов (полный рабочий день)
 * - Минимум 15 минут (не имеет смысла блокировать меньше)
 * - Защита от случайных ошибок пользователя
 * 
 * @param startTime - время начала в формате HH:MM
 * @param endTime - время окончания в формате HH:MM
 * @returns true если диапазон разумный
 */
export function isReasonableTimeRange(startTime: string, endTime: string): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  // От 15 минут до 12 часов
  return duration >= 15 && duration <= 720; // 720 минут = 12 часов
}

/**
 * Преобразует время в минуты от начала дня
 * 
 * ЛОГИКА ПРЕОБРАЗОВАНИЯ:
 * - HH:MM -> (HH * 60) + MM
 * - Упрощает сравнение и расчеты с временем
 * - Обработка некорректного формата
 * 
 * @param timeStr - время в формате HH:MM
 * @returns количество минут от 00:00
 */
export function timeToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.warn(`Invalid time format: ${timeStr}`);
    return 0;
  }
  
  return hours * 60 + minutes;
}

/**
 * Валидирует статус записи
 * 
 * ЛОГИКА СТАТУСОВ:
 * - Проверяем что статус из допустимого списка
 * - Используется при обновлении статуса записи
 * - Защита от некорректных данных
 * 
 * @param status - статус для проверки
 * @returns true если статус корректный
 */
export function isValidAppointmentStatus(status: string): boolean {
  const validStatuses = ['pending', 'confirmed', 'completed', 'canceled', 'no_show'];
  return validStatuses.includes(status);
}

/**
 * Валидирует переход статуса
 * 
 * ЛОГИКА ПЕРЕХОДОВ:
 * - Не все переходы статусов логичны
 * - pending -> confirmed, canceled (подтверждение или отмена)
 * - confirmed -> completed, no_show, canceled (завершение, неявка, отмена)
 * - completed -> нет переходов (финальное состояние)
 * - canceled -> нет переходов (финальное состояние)
 * - no_show -> нет переходов (финальное состояние)
 * 
 * @param currentStatus - текущий статус
 * @param newStatus - новый статус
 * @returns true если переход разрешен
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Карта разрешенных переходов
  const allowedTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'canceled'],
    'confirmed': ['completed', 'no_show', 'canceled'],
    'completed': [], // финальное состояние
    'canceled': [], // финальное состояние
    'no_show': [] // финальное состояние
  };
  
  const allowed = allowedTransitions[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

/**
 * Валидирует дату записи
 * 
 * ЛОГИКА ДАТА:
 * - Не в прошлом (нельзя создавать записи в прошлом)
 * - Не слишком далеко в будущем (ограничение бизнес-логики)
 * - Корректный формат даты
 * 
 * @param dateStr - дата в формате YYYY-MM-DD
 * @param maxDaysInFuture - максимум дней в будущем (по умолчанию 90)
 * @returns объект с результатом валидации и сообщением об ошибке
 */
export function validateAppointmentDate(
  dateStr: string, 
  maxDaysInFuture: number = 90
): { isValid: boolean; error?: string } {
  if (!dateStr.trim()) {
    return { isValid: false, error: 'Дата не указана' };
  }
  
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Некорректный формат даты' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return { isValid: false, error: 'Нельзя создать записи в прошлом' };
  }
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDaysInFuture);
  
  if (date > maxDate) {
    return { 
      isValid: false, 
      error: `Слишком далеко в будущем (максимум ${maxDaysInFuture} дней)` 
    };
  }
  
  return { isValid: true };
}

/**
 * Проверяет пересечение временных интервалов
 * 
 * ЛОГИКА ПЕРЕСЕЧЕНИЯ:
 * - Два интервала пересекаются если начало одного меньше конца другого
 * - И наоборот для второго интервала
 * - Используется для проверки конфликтов в расписании
 * 
 * @param start1 - начало первого интервала (HH:MM)
 * @param end1 - конец первого интервала (HH:MM)
 * @param start2 - начало второго интервала (HH:MM)
 * @param end2 - конец второго интервала (HH:MM)
 * @returns true если интервалы пересекаются
 */
export function doTimeRangesOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);
  
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}