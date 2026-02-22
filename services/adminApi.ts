/**
 * API слой для админки с Axios и TanStack Query
 * 
 * ЛОГИКА API СЛОЯ:
 * - Использование axios для HTTP запросов
 * - Интеграция с TanStack Query для кеширования
 * - Автоматические loading states и error handling
 * - Optimistic updates для мутаций
 * - Типизированные запросы и ответы
 */

import { 
  Appointment, 
  User, 
  Comment, 
  BlockedTime, 
  NewBlockedTimeForm,
  AdminStats,
  RevenueChartData
} from '@/types/admin';
import apiClient, { ApiResponse } from '@/lib/axios';

// === ТИПЫ ДЛЯ API ОТВЕТОВ ===

/**
 * Ответ для операций с заблокированным временем
 */
interface BlockedTimeResponse extends ApiResponse {
  blockedTime?: BlockedTime;
  blockedTimes?: BlockedTime[];
}

// === QUERY KEYS ===
export const adminQueryKeys = {
  all: ['admin'] as const,
  appointments: () => [...adminQueryKeys.all, 'appointments'] as const,
  users: () => [...adminQueryKeys.all, 'users'] as const,
  user: (id: number) => [...adminQueryKeys.users(), id] as const,
  comments: () => [...adminQueryKeys.all, 'comments'] as const,
  blockedTimes: () => [...adminQueryKeys.all, 'blocked-times'] as const,
  stats: (period?: string) => [...adminQueryKeys.all, 'stats', period] as const,
  revenue: (period: string) => [...adminQueryKeys.all, 'revenue', period] as const,
  settings: () => [...adminQueryKeys.all, 'settings'] as const,
} as const;

// === API ФУНКЦИИ С AXIOS ===

// === МЕТОДЫ ДЛЯ ЗАПИСЕЙ ===

/**
 * Получает все записи для админки
 */
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>('/api/appointments?admin=true');
  return response.data;
};

/**
 * Обновляет статус записи
 */
export const updateAppointmentStatus = async (
  appointmentId: number, 
  status: string
): Promise<void> => {
  await apiClient.patch(`/api/appointments/${appointmentId}/status`, { status });
};

/**
 * Удаляет запись
 */
export const deleteAppointment = async (appointmentId: number): Promise<void> => {
  await apiClient.delete(`/api/appointments/${appointmentId}`);
};

// === МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ===

/**
 * Получает список всех пользователей
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/api/users');
  return response.data;
};

/**
 * Получает детальную информацию о пользователе
 */
export const getUser = async (userId: number): Promise<User> => {
  const response = await apiClient.get<User>(`/api/users/${userId}`);
  return response.data;
};

/**
 * Обновляет роль пользователя
 */
export const updateUserRole = async (userId: number, role: string): Promise<void> => {
  await apiClient.patch(`/api/users/${userId}/role`, { role });
};

// === МЕТОДЫ ДЛЯ КОММЕНТАРИЕВ ===

/**
 * Получает все комментарии
 */
export const getComments = async (): Promise<Comment[]> => {
  const response = await apiClient.get<Comment[]>('/api/comments');
  return response.data;
};

/**
 * Удаляет комментарий
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  await apiClient.delete(`/api/comments/${commentId}`);
};

/**
 * Модерирует комментарий (скрывает/показывает)
 */
export const moderateComment = async (
  commentId: number, 
  isVisible: boolean
): Promise<void> => {
  await apiClient.patch(`/api/comments/${commentId}/moderate`, {
    is_visible: isVisible
  });
};

// === МЕТОДЫ ДЛЯ ЗАБЛОКИРОВАННОГО ВРЕМЕНИ ===

/**
 * Получает список заблокированного времени
 */
export const getBlockedTimes = async (): Promise<BlockedTime[]> => {
  const response = await apiClient.get<BlockedTimeResponse>('/api/blocked-times');
  
  if (response.data.success && response.data.blockedTimes) {
    return response.data.blockedTimes;
  }
  
  return [];
};

/**
 * Добавляет новое заблокированное время
 */
export const createBlockedTime = async (
  blockedTimeData: NewBlockedTimeForm
): Promise<BlockedTime> => {
  const response = await apiClient.post<BlockedTimeResponse>('/api/blocked-times', blockedTimeData);
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Ошибка создания заблокированного времени');
  }
  
  if (!response.data.blockedTime) {
    throw new Error('Сервер не вернул созданное заблокированное время');
  }
  
  return response.data.blockedTime;
};

/**
 * Обновляет заблокированное время
 */
export const updateBlockedTime = async (
  blockedTimeId: number, 
  blockedTimeData: Partial<NewBlockedTimeForm>
): Promise<BlockedTime> => {
  const response = await apiClient.put<BlockedTimeResponse>(
    `/api/blocked-times/${blockedTimeId}`, 
    blockedTimeData
  );
  
  if (!response.data.success || !response.data.blockedTime) {
    throw new Error(response.data.error || 'Ошибка обновления заблокированного времени');
  }
  
  return response.data.blockedTime;
};

/**
 * Удаляет заблокированное время
 */
export const deleteBlockedTime = async (blockedTimeId: number): Promise<void> => {
  await apiClient.delete(`/api/blocked-times/${blockedTimeId}`);
};

// === МЕТОДЫ ДЛЯ СТАТИСТИКИ ===

/**
 * Получает агрегированную статистику
 */
export const getStats = async (period?: string): Promise<AdminStats> => {
  const params = period ? `?period=${period}` : '';
  const response = await apiClient.get<AdminStats>(`/api/admin/stats${params}`);
  return response.data;
};

/**
 * Получает данные для графика доходов
 */
export const getRevenueData = async (period: string): Promise<RevenueChartData[]> => {
  const response = await apiClient.get<RevenueChartData[]>(`/api/admin/revenue?period=${period}`);
  return response.data;
};

// === МЕТОДЫ ДЛЯ НАСТРОЕК ===

/**
 * Получает настройки системы
 */
export const getSettings = async (): Promise<Record<string, unknown>> => {
  const response = await apiClient.get<Record<string, unknown>>('/api/admin/settings');
  return response.data;
};

/**
 * Обновляет настройки системы
 */
export const updateSettings = async (
  settings: Record<string, unknown>
): Promise<void> => {
  await apiClient.patch('/api/admin/settings', settings);
};

// === ЭКСПОРТЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ===

/**
 * Класс для обратной совместимости (устарел, используйте отдельные функции)
 * @deprecated Используйте отдельные функции вместо класса
 */
export class AdminApiClient {
  getAppointments = getAppointments;
  updateAppointmentStatus = updateAppointmentStatus;
  deleteAppointment = deleteAppointment;
  getUsers = getUsers;
  getUser = getUser;
  updateUserRole = updateUserRole;
  getComments = getComments;
  deleteComment = deleteComment;
  moderateComment = moderateComment;
  getBlockedTimes = getBlockedTimes;
  createBlockedTime = createBlockedTime;
  updateBlockedTime = updateBlockedTime;
  deleteBlockedTime = deleteBlockedTime;
  getStats = getStats;
  getRevenueData = getRevenueData;
  getSettings = getSettings;
  updateSettings = updateSettings;
}

/**
 * Экземпляр для обратной совместимости
 * @deprecated Используйте отдельные функции вместо adminApi
 */
export const adminApi = new AdminApiClient();

export type { BlockedTimeResponse };