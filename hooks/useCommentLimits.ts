import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { CommentLimitResponse } from '@/types/comment-limits';

/**
 * Получает лимиты комментариев с сервера
 */
async function fetchCommentLimits(): Promise<CommentLimitResponse> {
  const { data } = await apiClient.get<CommentLimitResponse>('/api/comments/limits');
  return data;
}

/**
 * Хук для получения и кэширования лимитов комментариев
 */
export function useCommentLimits() {
  return useQuery({
    queryKey: ['comment-limits'],
    queryFn: fetchCommentLimits,
    staleTime: 30 * 1000, // 30 секунд
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
    retry: 1
  });
}

/**
 * Хук для проверки возможности создания комментария
 */
export function useCanCreateComment() {
  const { data, isLoading, error } = useCommentLimits();
  
  return {
    canComment: data?.limits.canComment ?? false,
    availableComments: data?.limits.availableComments ?? 0,
    totalComments: data?.limits.totalComments ?? 0,
    completedAppointments: data?.limits.completedAppointments ?? 0,
    isLoading,
    error,
    limits: data?.limits
  };
}