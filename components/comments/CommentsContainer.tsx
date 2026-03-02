'use client';

import { useCallback } from 'react';
import { CommentForm } from './CommentForm';
import { CommentsList } from './CommentsList';
import { useCommentForm } from '@/hooks/comments/useCommentForm';
import { useCommentsData } from '@/hooks/comments/useCommentsData';

interface CurrentUser {
  id: number;
  username: string;
  avatar: string | null;
}

interface CommentsContainerProps {
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUser?: CurrentUser;
}

/**
 * 🎯 НОВАЯ АРХИТЕКТУРА:
 * 
 * ✅ Container Pattern: Компонент только оркестрирует логику
 * ✅ Composition: Собирает малые компоненты в один flow
 * ✅ Clean separation: Каждый компонент имеет свою ответственность
 * ✅ Backward compatibility: Тот же API что у старого CommentsSection
 */
export function CommentsContainer({ 
  onLoadMore,
  hasMore = false,
  currentUser
}: CommentsContainerProps) {
  
  // 📚 ОБУЧЕНИЕ: Проверяем авторизацию в контейнере
  if (!currentUser) {
    return (
      <div className="bg-black p-4 text-center">
        <p className="text-red-400">Необходимо авторизоваться для просмотра комментариев</p>
      </div>
    );
  }

  // 📚 ОБУЧЕНИЕ: Используем наши кастомные хуки
  const { comments, isLoading } = useCommentsData();
  const { submitComment, isSubmitting, canComment, availableComments } = useCommentForm({ 
    userId: currentUser.id 
  });

  // 📚 ОБУЧЕНИЕ: Обработчик удаления (пока заглушка, но уже готов к реализации)
  const handleDelete = useCallback(async (commentId: number) => {
    console.log('deleted comment with id', { commentId });
  }, []);

  // 📚 ОБУЧЕНИЕ: Контейнер просто соединяет компоненты
  return (
    <div className="bg-black">
      {/* 📚 ОБУЧЕНИЕ: Форма изолирована, получает только нужные пропсы */}
      <CommentForm
        currentUser={currentUser}
        onSubmit={submitComment}
        isSubmitting={isSubmitting}
        canComment={canComment}
        availableComments={availableComments}
      />
      
      {/* 📚 ОБУЧЕНИЕ: Список изолирован, получает только нужные данные */}
      <CommentsList
        comments={comments}
        currentUser={currentUser}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onDelete={handleDelete}
      />
    </div>
  );
}