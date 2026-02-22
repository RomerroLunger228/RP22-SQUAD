/**
 * API утилиты для работы с рабочими часами
 * Миграция с fetch на axios с полной типизацией
 * 
 * Принципы SOLID:
 * - Single Responsibility: только API взаимодействие
 * - Dependency Inversion: абстракция над axios API
 */

import { WorkingDayForm } from '@/types/admin';
import apiClient, { ApiResponse } from '@/lib/axios';

/**
 * Загружает настройки рабочих часов
 */
export async function fetchWorkingHours(): Promise<WorkingDayForm[]> {
  const response = await apiClient.get<ApiResponse<WorkingDayForm[]>>('/api/working-hours');
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Ошибка загрузки данных');
  }

  if (!response.data.data) {
    throw new Error('Данные не получены');
  }

  // Преобразуем в формат для формы
  return response.data.data.map(transformToFormData);
}

/**
 * Сохраняет настройки рабочих часов
 */
export async function saveWorkingHours(workingDays: WorkingDayForm[]): Promise<void> {
  const response = await apiClient.put<ApiResponse<WorkingDayForm[]>>('/api/working-hours', {
    workingDays
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Ошибка сохранения данных');
  }
}

/**
 * Преобразует данные из API в формат для формы
 */
function transformToFormData(day: WorkingDayForm): WorkingDayForm {
  return {
    weekday: day.weekday,
    start_time: day.start_time || '',
    end_time: day.end_time || '',
    is_working: day.is_working
  };
}