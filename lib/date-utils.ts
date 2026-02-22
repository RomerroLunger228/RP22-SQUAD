// lib/date-utils.ts
/**
 * Безопасная работа с датами для бронирования
 * Все даты храним и передаем в UTC
 */

/**
 * Преобразует Date в строку YYYY-MM-DD (UTC)
 */
export function dateToUTCString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Преобразует строку YYYY-MM-DD в Date (UTC)
 */
export function stringToUTCDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

/**
 * Создает Date из локальной даты (из календаря) в UTC
 */
export function localDateToUTC(date: Date): Date {
    return new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
    ));
}

/**
 * Форматирует время из Date (хранится как DateTime в БД)
 */
export function formatTimeFromDB(dateTime: Date | null): string | null {
    if (!dateTime) return null;
    
    // Важно: время в БД хранится как полная дата, например "1970-01-01T14:30:00.000Z"
    // Нам нужно только время "14:30:00"
    const timeString = dateTime.toISOString().split('T')[1];
    return timeString.substring(0, 8); // "14:30:00"
}

/**
 * Форматирует время для отображения (14:30:00 → 14:30)
 */
export function formatTimeForDisplay(timeStr: string | null): string {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5); // "14:30"
}


export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Парсит строку времени (HH:MM или HH:MM:SS) в Date UTC
 * Используется для сохранения времени в БД
 * 
 * @param timeStr - строка времени в формате "HH:MM" или "HH:MM:SS"
 * @returns Date объект с UTC временем от эпохи 1970-01-01
 */
export function parseTimeToUTC(timeStr: string): Date {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parts[2] ? parseInt(parts[2]) : 0;
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
}