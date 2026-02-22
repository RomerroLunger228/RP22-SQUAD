/**
 * Утилиты расчетов и фильтрации для админки
 * 
 * ЛОГИКА РАЗДЕЛЕНИЯ:
 * - Чистые функции для бизнес-логики
 * - Переиспользуемые алгоритмы фильтрации
 * - Расчеты статистики и аналитики
 * - Генерация данных для графиков
 */

import { 
  Appointment, 
  FilterPeriodType, 
  ChartPeriodType,
  RevenueChartData,
  StatusStats,
  CategoryStats
} from '@/types/admin';
import { MONTH_NAMES, DAY_NAMES } from './constants';
import { getAppointmentRevenue } from '@/utils/price-utils';

/**
 * Фильтрует записи по временному периоду или статусу
 * 
 * ЛОГИКА ФИЛЬТРОВ:
 * Временные периоды:
 * - all: без фильтрации (для общей статистики)
 * - day: только сегодня (для ежедневной работы)
 * - week: последние 7 дней включая сегодня (недельный обзор)
 * - month: с начала текущего месяца до сегодня (месячная отчетность)
 * - upcoming: сегодня + все будущие записи (планирование)
 * 
 * Статусные фильтры:
 * - confirmed: только подтвержденные записи
 * - completed: только завершенные записи
 * - canceled: только отмененные записи  
 * - no_show: только неявки
 * 
 * @param appointments - массив записей
 * @param filter - тип фильтра (временной или статусный)
 * @returns отфильтрованный массив записей
 */
export function getFilteredAppointments(
  appointments: Appointment[], 
  filter: FilterPeriodType
): Appointment[] {
  // Статусные фильтры
  const statusFilters = ['confirmed', 'completed', 'canceled', 'no_show'];
  if (statusFilters.includes(filter)) {
    return appointments.filter(appointment => appointment.status === filter);
  }

  // Временные фильтры
  if (filter === 'all') {
    return appointments;
  }

  const now = new Date();
  let startDate: Date;
  let endDate: Date | null = null;

  switch (filter) {
    case 'day':
      // Только сегодняшние записи (00:00 - 23:59 сегодня)
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'week':
      // Последние 7 дней включая сегодня
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // 6 дней назад + сегодня = 7 дней
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'month':
      // С начала текущего месяца до сегодня
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'upcoming':
      // Сегодня + все будущие записи
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = null; // без ограничения на будущее
      break;
      
    default:
      console.warn(`Unknown filter: ${filter}`);
      return appointments;
  }

  return appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    
    // Проверяем валидность даты
    if (isNaN(appointmentDate.getTime())) {
      console.warn(`Invalid appointment date: ${appointment.appointment_date}`);
      return false;
    }
    
    if (endDate) {
      return appointmentDate >= startDate && appointmentDate <= endDate;
    } else {
      return appointmentDate >= startDate;
    }
  });
}

/**
 * Вычисляет статистику по статусам записей
 * 
 * ЛОГИКА ПОДСЧЕТА:
 * - Простой подсчет по статусам
 * - Используется для карточек статистики в дашборде
 * - Работает с отфильтрованными данными
 * 
 * @param appointments - массив записей (может быть отфильтрован)
 * @returns объект со счетчиками по каждому статусу
 */
export function getOverallStatusStats(appointments: Appointment[]): StatusStats {
  const stats: StatusStats = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    canceled: 0,
    no_show: 0
  };
  
  appointments.forEach(appointment => {
    switch (appointment.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'confirmed':
        stats.confirmed++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'canceled':
        stats.canceled++;
        break;
      case 'no_show':
        stats.no_show++;
        break;
      default:
        console.warn(`Unknown appointment status: ${appointment.status}`);
    }
  });
  
  return stats;
}

/**
 * Вычисляет статистику по категориям услуг
 * 
 * ЛОГИКА АГРЕГАЦИИ:
 * - Группировка по категориям с подсчетом статусов
 * - Расчет дохода только с завершенных услуг (completed)
 * - Показываем все категории, даже если нет записей в выбранном периоде
 * - Сортировка по ID категории для консистентности
 * 
 * @param allAppointments - все записи (для получения списка категорий)
 * @param filteredAppointments - отфильтрованные записи (для статистики)
 * @returns массив статистики по категориям
 */
export function getCategoryStats(
  allAppointments: Appointment[],
  filteredAppointments: Appointment[]
): CategoryStats[] {
  // Получаем все уникальные категории из всех записей
  const allCategories = Array.from(
    new Set(
      allAppointments.map(apt => 
        JSON.stringify({id: apt.category.id, name: apt.category.name})
      )
    )
  ).map(str => JSON.parse(str));

  if (allCategories.length === 0) {
    return [];
  }

  // Инициализируем статистику для всех категорий
  const categoryMap = new Map<number, CategoryStats>();

  allCategories.forEach(category => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      count: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      canceled: 0,
      no_show: 0,
      revenue: 0
    });
  });

  // Подсчитываем статистику только для отфильтрованных записей
  filteredAppointments.forEach(appointment => {
    const categoryId = appointment.category.id;
    const stats = categoryMap.get(categoryId);
    
    if (!stats) {
      console.warn(`Category not found in map: ${categoryId}`);
      return;
    }

    stats.count++;

    switch (appointment.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'confirmed':
        stats.confirmed++;
        break;
      case 'completed':
        stats.completed++;
        stats.revenue += getAppointmentRevenue(appointment);
        break;
      case 'canceled':
        stats.canceled++;
        break;
      case 'no_show':
        stats.no_show++;
        break;
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => a.id - b.id);
}

/**
 * Генерирует данные для графика доходов
 * 
 * ЛОГИКА ПЕРИОДОВ:
 * - 7days: по дням (детальный анализ)
 * - 30days: по неделям (5 недель по 7 дней)
 * - 3months: по месяцам (последние 6 месяцев)
 * 
 * ЛОГИКА ДОХОДА:
 * - Учитываются только завершенные записи (completed)
 * - Группировка по периодам с суммированием
 * - Добавление полной даты для тултипов
 * 
 * @param period - тип периода для графика
 * @param appointments - все записи
 * @returns массив данных для графика
 */
export function generateRevenueData(
  period: ChartPeriodType, 
  appointments: Appointment[]
): RevenueChartData[] {
  const currentDate = new Date();
  const chartData: RevenueChartData[] = [];

  if (period === '3months') {
    // Последние 6 месяцев
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      const monthRevenue = appointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return apt.status === 'completed' && 
                 aptDate.getMonth() === targetMonth && 
                 aptDate.getFullYear() === targetYear;
        })
        .reduce((total, apt) => total + getAppointmentRevenue(apt), 0);
      
      chartData.push({ 
        month: MONTH_NAMES[targetMonth], 
        amount: monthRevenue,
        fullDate: `${MONTH_NAMES[targetMonth]} ${targetYear}`
      });
    }
  } else if (period === '30days') {
    // Последние 5 недель (по 7 дней каждая)
    for (let i = 4; i >= 0; i--) {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - (i * 7 + 6));
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() - (i * 7));
      
      const weekRevenue = appointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return apt.status === 'completed' && 
                 aptDate >= startDate && 
                 aptDate <= endDate;
        })
        .reduce((total, apt) => total + getAppointmentRevenue(apt), 0);
      
      chartData.push({
        month: `Week ${5-i}`,
        amount: weekRevenue,
        fullDate: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      });
    }
  } else if (period === '7days') {
    // Последние 7 дней
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - i);
      
      const dayRevenue = appointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return apt.status === 'completed' && 
                 aptDate.toDateString() === targetDate.toDateString();
        })
        .reduce((total, apt) => total + getAppointmentRevenue(apt), 0);
      
      chartData.push({
        month: DAY_NAMES[targetDate.getDay()],
        amount: dayRevenue,
        fullDate: targetDate.toLocaleDateString()
      });
    }
  }

  return chartData;
}

/**
 * Вычисляет процентное изменение между двумя значениями
 * 
 * ЛОГИКА РАСЧЕТА:
 * - Стандартная формула: ((новое - старое) / старое) * 100
 * - Обработка деления на ноль
 * - Возврат 100% если было 0, стало больше 0
 * - Возврат 0% если оба значения равны 0
 * 
 * @param currentValue - текущее значение
 * @param previousValue - предыдущее значение
 * @returns процент изменения (может быть отрицательным)
 */
export function calculatePercentChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Группирует записи по дате
 * 
 * ЛОГИКА ГРУППИРОВКИ:
 * - Группировка по строке даты (YYYY-MM-DD)
 * - Сортировка дат в хронологическом порядке
 * - Используется для календарных представлений
 * 
 * @param appointments - массив записей
 * @returns Map с датами как ключами и массивами записей как значениями
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>();
  
  appointments.forEach(appointment => {
    const dateKey = appointment.appointment_date;
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    
    grouped.get(dateKey)!.push(appointment);
  });
  
  // Сортируем записи внутри каждой даты по времени
  grouped.forEach(appointmentsForDate => {
    appointmentsForDate.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  });
  
  return grouped;
}

/**
 * Находит самые популярные услуги
 * 
 * ЛОГИКА РАНЖИРОВАНИЯ:
 * - Подсчет количества записей по услугам
 * - Сортировка по убыванию популярности
 * - Ограничение топ-N результатов
 * 
 * @param appointments - массив записей
 * @param limit - максимальное количество результатов
 * @returns массив популярных услуг с количеством записей
 */
export function getPopularServices(
  appointments: Appointment[], 
  limit: number = 5
): Array<{serviceName: string, count: number, revenue: number}> {
  const serviceStats = new Map<string, {count: number, revenue: number}>();
  
  appointments.forEach(appointment => {
    const serviceName = appointment.service.name;
    const existing = serviceStats.get(serviceName) || {count: 0, revenue: 0};
    
    existing.count++;
    if (appointment.status === 'completed') {
      existing.revenue += getAppointmentRevenue(appointment);
    }
    
    serviceStats.set(serviceName, existing);
  });
  
  return Array.from(serviceStats.entries())
    .map(([serviceName, stats]) => ({
      serviceName,
      count: stats.count,
      revenue: stats.revenue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}