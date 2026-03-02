import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Comment as CommentType } from '@/types/comment';
import { fetchComments } from '@/utils/fetchComments';

/**
 * 🎯 ИСПРАВЛЕНИЕ ПРОБЛЕМ:
 * 
 * ✅ Выделение data fetching логики: Отдельно от UI компонентов
 * ✅ Centralised cache management: Вся логика кеша в одном месте
 * ✅ Reusability: Можно использовать в админке, профиле и т.д.
 * ✅ Consistent stale time: Единая политика кеширования
 */
export function useCommentsData() {
  const queryClient = useQueryClient();

  // 📚 ОБУЧЕНИЕ: Централизованная загрузка комментариев
  const {
    data: comments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments'],
    queryFn: fetchComments,
    staleTime: 2 * 60 * 1000, // 2 минуты - комментарии обновляются не очень часто
    // 📚 ОБУЧЕНИЕ: Настройки для оптимальной работы с комментариями
    refetchOnWindowFocus: false, // Не перезагружаем при фокусе
    retry: 2, // Повторяем запрос 2 раза при ошибке
  });

  // 📚 ОБУЧЕНИЕ: Функция для удаления комментария из кеша
  const removeCommentFromCache = useCallback((commentId: number) => {
    queryClient.setQueryData<CommentType[]>(['comments'], (old) => {
      if (!old) return [];
      return old.filter(comment => comment.id !== commentId);
    });
  }, [queryClient]);

  // 📚 ОБУЧЕНИЕ: Функция для добавления комментария в кеш (для optimistic updates)
  const addCommentToCache = useCallback((newComment: CommentType) => {
    queryClient.setQueryData<CommentType[]>(['comments'], (old) => [
      newComment,
      ...(old || [])
    ]);
  }, [queryClient]);

  // 📚 OBУЧЕНИЕ: Функция для инвалидации кеша (когда нужно перезагрузить данные)
  const invalidateComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comments'] });
  }, [queryClient]);

  // 📚 ОБУЧЕНИЕ: Хук возвращает данные + функции управления кешем
  return {
    // Data
    comments,
    isLoading,
    error,
    
    // Actions
    refetch,
    removeCommentFromCache,
    addCommentToCache,
    invalidateComments,
    
    // Meta
    hasComments: comments.length > 0
  };
}