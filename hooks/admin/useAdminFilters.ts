/**
 * Хук для фильтрации данных и генерации статистики
 * 
 * ЛОГИКА ХУКА:
 * - Отделяет логику фильтрации от UI
 * - Мемоизация для производительности
 * - Реактивное обновление при изменении данных
 * - Централизованная логика статистики
 */

import { useState, useMemo } from 'react';
import { 
  Appointment, 
  FilterPeriodType, 
  ChartPeriodType,
  RevenueChartData,
  StatusStats,
  CategoryStats
} from '@/types/admin';
import { 
  getFilteredAppointments,
  getOverallStatusStats,
  getCategoryStats,
  generateRevenueData 
} from '@/utils/admin/calculations';

interface UseAdminFiltersReturn {
  // Фильтры
  timePeriodFilter: FilterPeriodType;
  chartPeriodFilter: ChartPeriodType;
  setTimePeriodFilter: (period: FilterPeriodType) => void;
  setChartPeriodFilter: (period: ChartPeriodType) => void;
  
  // Отфильтрованные данные
  filteredAppointments: Appointment[];
  
  // Статистика
  statusStats: StatusStats;
  categoryStats: CategoryStats[];
  revenueData: RevenueChartData[];
  
  // Дополнительные фильтры
  dateFilter: string;
  setDateFilter: (date: string) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
}

/**
 * Кастомный хук для фильтрации и статистики админки
 * 
 * ЛОГИКА АРХИТЕКТУРЫ:
 * - Мемоизация тяжелых вычислений (useMemo)
 * - Реактивность - статистика пересчитывается при изменении данных или фильтров
 * - Разделение фильтров для разных целей (список записей vs график)
 * - Дополнительные фильтры для специфичных случаев
 */
export function useAdminFilters(appointments: Appointment[]): UseAdminFiltersReturn {
  // === СОСТОЯНИЕ ФИЛЬТРОВ ===
  
  const [timePeriodFilter, setTimePeriodFilter] = useState<FilterPeriodType>('all');
  const [chartPeriodFilter, setChartPeriodFilter] = useState<ChartPeriodType>('3months');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // === ОТФИЛЬТРОВАННЫЕ ДАННЫЕ ===
  
  /**
   * Основные отфильтрованные записи для UI списков и статистики
   * 
   * ЛОГИКА МЕМОИЗАЦИИ:
   * - Пересчитывается только при изменении записей или фильтра
   * - Избегаем лишних вычислений при ререндерах
   */
  const filteredAppointments = useMemo(() => {
    return getFilteredAppointments(appointments, timePeriodFilter);
  }, [appointments, timePeriodFilter]);
  
  // === СТАТИСТИКА ===
  
  /**
   * Статистика по статусам для отфильтрованных записей
   * 
   * ЛОГИКА: Показывает распределение статусов в выбранном периоде
   * Используется для карточек в дашборде
   */
  const statusStats = useMemo(() => {
    return getOverallStatusStats(filteredAppointments);
  }, [filteredAppointments]);
  
  /**
   * Статистика по категориям
   * 
   * ЛОГИКА: 
   * - Показываем все категории (из всех записей)
   * - Но статистику считаем только для отфильтрованных
   * - Это позволяет видеть полную картину категорий даже если в периоде нет записей
   */
  const categoryStats = useMemo(() => {
    return getCategoryStats(appointments, filteredAppointments);
  }, [appointments, filteredAppointments]);
  
  /**
   * Данные для графика доходов
   * 
   * ЛОГИКА:
   * - Используем отдельный фильтр для графика (chartPeriodFilter)
   * - График может показывать другой период чем список записей
   * - Всегда используем все записи для графика (не фильтрованные по timePeriodFilter)
   */
  const revenueData = useMemo(() => {
    return generateRevenueData(chartPeriodFilter, appointments);
  }, [chartPeriodFilter, appointments]);
  
  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===
  
  /**
   * Получает записи для конкретной даты
   * 
   * ЛОГИКА: Используется для календарного представления
   * Не мемоизируется так как вызывается редко и с разными параметрами
   */
  const getAppointmentsByDate = (date: string): Appointment[] => {
    return appointments.filter(appointment => appointment.appointment_date === date);
  };
  
  return {
    // Фильтры
    timePeriodFilter,
    chartPeriodFilter,
    setTimePeriodFilter,
    setChartPeriodFilter,
    
    // Отфильтрованные данные
    filteredAppointments,
    
    // Статистика
    statusStats,
    categoryStats,
    revenueData,
    
    // Дополнительные фильтры
    dateFilter,
    setDateFilter,
    getAppointmentsByDate,
  };
}