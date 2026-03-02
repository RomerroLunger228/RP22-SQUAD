import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCommentStore } from '@/lib/stores/commentCountStore';
import { useCanCreateComment } from '@/hooks/useCommentLimits';
import { createComment } from '@/utils/fetchComments';
import { Comment as CommentType } from '@/types/comment';
import toast from 'react-hot-toast';
import axios from 'axios';

interface UseCommentFormProps {
  userId: number;
}

/**
 * 🎯 ИСПРАВЛЕНИЕ ПРОБЛЕМ:
 * 
 * ✅ Выделение логики: Вся бизнес-логика формы в одном месте
 * ✅ Переиспользуемость: Можно использовать в разных компонентах
 * ✅ Тестируемость: Легко мокать и тестировать отдельно
 * ✅ Separation of Concerns: Хук не знает про UI, только про логику
 */
export function useCommentForm({ userId }: UseCommentFormProps) {
  const queryClient = useQueryClient();
  const incrementCommentsCount = useCommentStore(state => state.incrementCommentsCount);
  const { canComment, availableComments } = useCanCreateComment();

  // 📚 ОБУЧЕНИЕ: Мутация вынесена в хук - компонент не знает про API детали
  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (newComment: CommentType) => {
      // 📚 ОБУЧЕНИЕ: Optimistic update в одном месте
      queryClient.setQueryData<CommentType[]>(['comments'], (old) => [
        newComment,
        ...(old || [])
      ]);
      
      // 📚 ОБУЧЕНИЕ: Все side-effects сгруппированы
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['comment-limits'] });
      incrementCommentsCount();
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      
      // 📚 ОБУЧЕНИЕ: Centralized error handling с типизацией
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.limits) {
          toast.error(errorData.error || 'Достигнут лимит комментариев');
          queryClient.invalidateQueries({ queryKey: ['comment-limits'] });
          return;
        }
      }
      
      toast.error('Не удалось создать комментарий. Попробуйте еще раз.');
    },
  });

  // 📚 ОБУЧЕНИЕ: Главная функция хука - простой интерфейс для компонента
  const submitComment = async (content: string) => {
    // Валидация в хуке, не в компоненте
    if (!content.trim()) {
      toast.error('Комментарий не может быть пустым');
      return;
    }
    
    if (!canComment) {
      toast.error(`Вы достигли лимита комментариев. Доступно: ${availableComments}`);
      return;
    }

    // Отправляем комментарий
    createCommentMutation.mutate({
      userId,
      content: content.trim()
    });
  };

  // 📚 ОБУЧЕНИЕ: Хук возвращает только то, что нужно компоненту
  return {
    submitComment,
    isSubmitting: createCommentMutation.isPending,
    canComment,
    availableComments,
    error: createCommentMutation.error
  };
}