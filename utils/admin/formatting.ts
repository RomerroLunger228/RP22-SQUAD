/**
 * Утилиты форматирования для админки
 * 
 * ЛОГИКА РАЗДЕЛЕНИЯ:
 * - Чистые функции без побочных эффектов
 * - Каждая функция решает одну задачу форматирования
 * - Централизованные правила форматирования
 * - Легко тестировать и модифицировать
 */

import { AppointmentStatus, StatusInfo } from '../../types/admin';
import { STATUS_STYLES, STATUS_LABELS } from './constants';

/**
 * Форматирует дату в человекочитаемый вид
 * 
 * ЛОГИКА ФОРМАТИРОВАНИЯ:
 * - Русская локаль (ru-RU) для локализации интерфейса
 * - Короткий день недели (пн, вт) для компактности
 * - Без года, если текущий год (экономия места)
 * - Консистентный формат во всей админке
 * 
 * @param dateStr - дата в формате ISO (YYYY-MM-DD или полный ISO datetime)
 * @returns отформатированная дата типа "пн 15 янв"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  
  // Проверяем валидность даты
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateStr}`);
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short', // пн, вт, ср
    day: 'numeric',   // 1, 2, 3, ..., 31
    month: 'short'    // янв, фев, мар
    // Намеренно убрали timeZone чтобы показывать дату как есть в БД
    // Для записи важна локальная дата пользователя, а не UTC
  });
}

/**
 * Форматирует время в консистентный вид
 * 
 * ЛОГИКА ОБРАБОТКИ:
 * - Обрабатывает разные форматы времени из БД
 * - HH:MM:SS -> HH:MM (убираем секунды для UI)
 * - HH:MM -> HH:MM (оставляем как есть)
 * - Fallback через Date для нестандартных форматов
 * - Польская локаль для консистентности
 * 
 * @param timeStr - время в различных форматах
 * @returns время в формате "HH:MM"
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) {
    console.warn('Empty time string provided');
    return '';
  }
  
  // Если время уже в формате HH:MM, возвращаем как есть
  if (timeStr.length === 5 && timeStr.includes(':')) {
    return timeStr;
  }
  
  // Если время в формате HH:MM:SS, обрезаем секунды
  if (timeStr.length === 8 && timeStr.includes(':')) {
    return timeStr.substring(0, 5);
  }
  
  // Fallback для других форматов через Date
  try {
    const time = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(time.getTime())) {
      console.warn(`Invalid time string: ${timeStr}`);
      return timeStr; // возвращаем исходную строку если не смогли распарсить
    }
    
    return time.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error, 'Input:', timeStr);
    return timeStr;
  }
}

/**
 * Получает информацию о статусе для UI
 * 
 * ЛОГИКА СТАТУСОВ:
 * - Централизованное управление стилями статусов
 * - Консистентные цвета во всей админке
 * - Типизированный возврат для автодополнения
 * - Fallback для неизвестных статусов
 * 
 * @param status - статус записи
 * @returns объект с текстом, цветами фона и текста
 */
export function getStatusInfo(status: AppointmentStatus): StatusInfo {
  const styles = STATUS_STYLES[status];
  const label = STATUS_LABELS[status];
  
  if (!styles || !label) {
    console.warn(`Unknown appointment status: ${status}`);
    return {
      text: 'Неизвестно',
      color: 'bg-gradient-to-r from-gray-600 to-gray-500',
      textColor: 'text-gray-200'
    };
  }
  
  return {
    text: label,
    color: styles.background,
    textColor: styles.text
  };
}

/**
 * Форматирует валютную сумму
 * 
 * ЛОГИКА ВАЛЮТЫ:
 * - Польские злотые (PLN) - основная валюта
 * - Без десятичных знаков (услуги обычно целые суммы)
 * - Пробел между числом и валютой для читаемости
 * - Обработка нулевых и отрицательных сумм
 * 
 * @param amount - сумма в злотых
 * @returns отформатированная строка типа "150 PLN"
 */
export function formatCurrency(amount: number): string {
  if (amount < 0) {
    return `-${Math.abs(amount)} PLN`;
  }
  
  if (amount === 0) {
    return '0 PLN';
  }
  
  return `${amount} PLN`;
}

/**
 * Форматирует процентное изменение
 * 
 * ЛОГИКА ПРОЦЕНТОВ:
 * - Округление до 1 знака после запятой
 * - Знак + для положительных значений (показывает рост явно)
 * - Цветовое кодирование через CSS классы
 * - Обработка нулевых значений
 * 
 * @param percentChange - процент изменения
 * @returns объект с отформатированным текстом и CSS классом для цвета
 */
export function formatPercentChange(percentChange: number): {
  text: string;
  colorClass: string;
} {
  const absValue = Math.abs(percentChange);
  const roundedValue = Math.round(absValue * 10) / 10; // округление до 1 знака
  
  if (percentChange > 0) {
    return {
      text: `+${roundedValue}%`,
      colorClass: 'text-green-400'
    };
  } else if (percentChange < 0) {
    return {
      text: `-${roundedValue}%`,
      colorClass: 'text-red-400'
    };
  } else {
    return {
      text: '0%',
      colorClass: 'text-gray-400'
    };
  }
}

/**
 * Форматирует продолжительность в человекочитаемый вид
 * 
 * ЛОГИКА ПРОДОЛЖИТЕЛЬНОСТИ:
 * - Минуты как основная единица для услуг
 * - Автоматическое преобразование в часы при необходимости
 * - Русские сокращения (мин/ч) для локализации
 * - Обработка краевых случаев (0, отрицательные значения)
 * 
 * @param minutes - продолжительность в минутах
 * @returns отформатированная строка типа "90 мин" или "2ч 30мин"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return '0 мин';
  }
  
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}ч`;
  }
  
  return `${hours}ч ${remainingMinutes}мин`;
}

/**
 * Создает сокращенный текст с многоточием
 * 
 * ЛОГИКА СОКРАЩЕНИЯ:
 * - Для длинных названий услуг и комментариев
 * - Умное сокращение по словам (не рвет слова)
 * - Многоточие только если текст действительно обрезан
 * - Сохранение пробелов и структуры
 * 
 * @param text - исходный текст
 * @param maxLength - максимальная длина
 * @returns сокращенный текст с многоточием при необходимости
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Ищем последний пробел до максимальной длины
  const trimmed = text.substring(0, maxLength);
  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  
  // Если пробел найден и он не слишком близко к началу, обрезаем по нему
  if (lastSpaceIndex > maxLength * 0.7) {
    return trimmed.substring(0, lastSpaceIndex) + '...';
  }
  
  // Иначе просто обрезаем и добавляем многоточие
  return trimmed + '...';
}