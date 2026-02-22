/**
 * Хук для админки с TanStack Query
 * 
 * ПРЕИМУЩЕСТВА:
 * - Автоматическое кеширование данных
 * - Background refetching и синхронизация
 * - Optimistic updates для лучшего UX
 * - Автоматические loading states для кнопок
 * - Error handling и retry логика из коробки
 * - Request deduplication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Appointment, 
  Comment, 
  BlockedTime,
  AdminStats,
  AppointmentStatus
} from '@/types/admin';
import { 
  getAppointments,
  getUsers, 
  getComments,
  getBlockedTimes,
  updateAppointmentStatus,
  deleteComment as deleteCommentAPI,
  createBlockedTime,
  deleteBlockedTime as deleteBlockedTimeAPI,
  adminQueryKeys
} from '@/services/adminApi';
import { createQueryKey } from '@/lib/axios';
import { calculatePercentChange } from '@/utils/admin/calculations';
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';

// === QUERY HOOKS ===

/**
 * Хук для загрузки записей с автоматическим кешированием
 */
export function useAppointments() {
  return useQuery({
    queryKey: createQueryKey('appointments', { admin: true }),
    queryFn: getAppointments,
    staleTime: 2 * 60 * 1000, // 2 минуты - данные часто меняются
  });
}

/**
 * Хук для загрузки пользователей
 */
export function useUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000, // 5 минут - данные изменяются реже
  });
}

/**
 * Хук для загрузки комментариев
 */
export function useComments() {
  return useQuery({
    queryKey: adminQueryKeys.comments(),
    queryFn: getComments,
    staleTime: 3 * 60 * 1000, // 3 минуты
  });
}

/**
 * Хук для загрузки заблокированного времени
 */
export function useBlockedTimes() {
  return useQuery({
    queryKey: adminQueryKeys.blockedTimes(),
    queryFn: getBlockedTimes,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

/**
 * Хук для вычисленной статистики на основе данных
 */
export function useAdminStats() {
  const { data: appointments = [] } = useAppointments();
  const { data: users = [] } = useUsers();
  
  // Вычисляем статистику в реальном времени
  const stats: AdminStats = (() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Записи текущего месяца
    const appointmentsThisMonth = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
    });
    
    // Записи прошлого месяца для сравнения
    const appointmentsLastMonth = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getMonth() === lastMonth && aptDate.getFullYear() === lastMonthYear;
    });
    
    // Пользователи текущего месяца
    const usersThisMonth = users.filter(user => {
      if (!user.created_at) return false;
      const userDate = new Date(user.created_at);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    });
    
    // Пользователи прошлого месяца
    const usersLastMonth = users.filter(user => {
      if (!user.created_at) return false;
      const userDate = new Date(user.created_at);
      return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear;
    });
    
    // Доход с завершенных записей текущего месяца
    const monthlyRevenue = appointmentsThisMonth
      .filter(apt => apt.status === 'completed')
      .reduce((total, apt) => total + (apt.final_price_charged || apt.service.pl_price), 0);
    
    // Статистика по статусам (только текущий месяц)
    const pendingThisMonth = appointmentsThisMonth.filter(apt => apt.status === 'pending').length;
    const noShowThisMonth = appointmentsThisMonth.filter(apt => apt.status === 'no_show').length;
    const canceledThisMonth = appointmentsThisMonth.filter(apt => apt.status === 'canceled').length;
    
    // Процентные изменения
    const appointmentsPercentChange = calculatePercentChange(
      appointmentsThisMonth.length, 
      appointmentsLastMonth.length
    );
    
    const usersPercentChange = calculatePercentChange(
      usersThisMonth.length,
      usersLastMonth.length
    );
    
    return {
      totalAppointments: appointments.length,
      totalUsers: users.length,
      appointmentsThisMonth: appointmentsThisMonth.length,
      usersThisMonth: usersThisMonth.length,
      appointmentsPercentChange: Math.round(appointmentsPercentChange * 100) / 100,
      usersPercentChange: Math.round(usersPercentChange * 100) / 100,
      monthlyRevenue,
      pendingThisMonth,
      noShowThisMonth,
      canceledThisMonth,
    };
  })();

  return stats;
}

// === MUTATION HOOKS ===

/**
 * Мутация для обновления статуса записи с optimistic updates
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { invalidateAdminAppointments } = useAppointmentInvalidation();
  
  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      console.log('Updating appointment status:', { appointmentId, status });
      console.log('API call to update status for appointment ID:', appointmentId);
      return updateAppointmentStatus(appointmentId, status);
    },
    
    // Optimistic update
    onMutate: async ({ appointmentId, status }) => {
      console.log('Starting optimistic update for appointment:', { appointmentId, status });
      const appointmentQueryKey = createQueryKey('appointments', { admin: true });
      
      // Отменяем исходящие запросы чтобы не перезаписать optimistic update
      await queryClient.cancelQueries({ queryKey: appointmentQueryKey });
      
      // Сохраняем предыдущее состояние для отката
      const previousAppointments = queryClient.getQueryData<Appointment[]>(appointmentQueryKey);
      
      // Optimistically update
      queryClient.setQueryData<Appointment[]>(appointmentQueryKey, (old) =>
        old?.map(apt => apt.id === appointmentId ? { ...apt, status: status as AppointmentStatus } : apt) || []
      );
      
      return { previousAppointments, appointmentQueryKey };
    },
    
    onError: (error, variables, context: { previousAppointments?: Appointment[]; appointmentQueryKey?: readonly unknown[] } | undefined) => {
      console.error('Appointment status update failed:', { error, variables, context });
      // Откатываем при ошибке
      if (context?.previousAppointments && context?.appointmentQueryKey) {
        queryClient.setQueryData(context.appointmentQueryKey, context.previousAppointments);
      }
      toast.error('Ошибка при обновлении статуса');
    },
    
    onSuccess: (_, variables) => {
      console.log('Appointment status update successful:', variables);
      toast.success(`Статус записи обновлен на "${variables.status}"`);
    },
    
    // Инвалидируем ВСЕ связанные с записями кэши
    onSettled: () => {
      invalidateAdminAppointments();
    },
  });
}

/**
 * Мутация для удаления комментария с optimistic updates
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCommentAPI,
    
    onMutate: async (commentId: number) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.comments() });
      
      const previousComments = queryClient.getQueryData(adminQueryKeys.comments());
      
      // Optimistically remove
      queryClient.setQueryData<Comment[]>(adminQueryKeys.comments(), (old) =>
        old?.filter(comment => comment.id !== commentId) || []
      );
      
      return { previousComments };
    },
    
    onError: (_, __, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(adminQueryKeys.comments(), context.previousComments);
      }
      toast.error('Ошибка при удалении комментария');
    },
    
    onSuccess: () => {
      toast.success('Комментарий удален');
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.comments() });
    },
  });
}

/**
 * Мутация для добавления заблокированного времени
 */
export function useCreateBlockedTime() {
  const queryClient = useQueryClient();
  const { invalidateAvailability } = useAppointmentInvalidation();
  
  return useMutation({
    mutationFn: createBlockedTime,
    
    onSuccess: (newBlockedTime) => {
      // Добавляем новое заблокированное время к существующим
      queryClient.setQueryData<BlockedTime[]>(adminQueryKeys.blockedTimes(), (old) => [
        ...(old || []),
        newBlockedTime
      ]);
      toast.success('Заблокированное время добавлено');
    },
    
    onError: () => {
      toast.error('Ошибка при добавлении заблокированного времени');
    },
    
    onSettled: () => {
      // Заблокированное время влияет только на доступность слотов
      invalidateAvailability();
    },
  });
}

/**
 * Мутация для удаления заблокированного времени
 */
export function useDeleteBlockedTime() {
  const queryClient = useQueryClient();
  const { invalidateAvailability } = useAppointmentInvalidation();
  
  return useMutation({
    mutationFn: deleteBlockedTimeAPI,
    
    onMutate: async (blockedTimeId: number) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.blockedTimes() });
      
      const previousBlockedTimes = queryClient.getQueryData(adminQueryKeys.blockedTimes());
      
      queryClient.setQueryData<BlockedTime[]>(adminQueryKeys.blockedTimes(), (old) =>
        old?.filter(bt => bt.id !== blockedTimeId) || []
      );
      
      return { previousBlockedTimes };
    },
    
    onError: (_, __, context) => {
      if (context?.previousBlockedTimes) {
        queryClient.setQueryData(adminQueryKeys.blockedTimes(), context.previousBlockedTimes);
      }
      toast.error('Ошибка при удалении заблокированного времени');
    },
    
    onSuccess: () => {
      toast.success('Заблокированное время удалено');
    },
    
    onSettled: () => {
      // Удаление заблокированного времени влияет только на доступность слотов
      invalidateAvailability();
    },
  });
}

// === СОСТАВНОЙ ХУК ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ===

/**
 * Составной хук, объединяющий все данные админки
 * Для обратной совместимости с существующими компонентами
 */
export function useAdminData() {
  const appointmentsQuery = useAppointments();
  const usersQuery = useUsers();
  const commentsQuery = useComments();
  const blockedTimesQuery = useBlockedTimes();
  
  const updateStatusMutation = useUpdateAppointmentStatus();
  const deleteCommentMutation = useDeleteComment();
  const createBlockedTimeMutation = useCreateBlockedTime();
  const deleteBlockedTimeMutation = useDeleteBlockedTime();
  
  const stats = useAdminStats();
  
  // Общий loading state
  const loading = appointmentsQuery.isLoading || 
                 usersQuery.isLoading || 
                 commentsQuery.isLoading || 
                 blockedTimesQuery.isLoading;
  
  // Общий error state
  const error = appointmentsQuery.error || 
               usersQuery.error || 
               commentsQuery.error || 
               blockedTimesQuery.error;
  
  return {
    // Данные
    appointments: appointmentsQuery.data || [],
    users: usersQuery.data || [],
    comments: commentsQuery.data || [],
    blockedTimes: blockedTimesQuery.data || [],
    stats,
    
    // Состояния
    loading,
    error: error ? String(error) : null,
    
    // Методы обновления (теперь они триггерят refetch автоматически)
    refreshAppointments: async () => { await appointmentsQuery.refetch(); },
    refreshUsers: async () => { await usersQuery.refetch(); },
    refreshComments: async () => { await commentsQuery.refetch(); },
    refreshBlockedTimes: async () => { await blockedTimesQuery.refetch(); },
    refreshAll: async () => {
      await Promise.all([
        appointmentsQuery.refetch(),
        usersQuery.refetch(),
        commentsQuery.refetch(),
        blockedTimesQuery.refetch(),
      ]);
    },
    
    // Методы изменения данных с loading states
    updateAppointmentStatus: async (appointmentId: number, status: string) => {
      updateStatusMutation.mutate({ appointmentId, status });
    },
    deleteComment: deleteCommentMutation.mutate,
    addBlockedTime: createBlockedTimeMutation.mutate,
    deleteBlockedTime: deleteBlockedTimeMutation.mutate,
    
    // Loading states для кнопок
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    isAddingBlockedTime: createBlockedTimeMutation.isPending,
    isDeletingBlockedTime: deleteBlockedTimeMutation.isPending,
  };
}

// Хуки уже экспортированы выше с помощью export function