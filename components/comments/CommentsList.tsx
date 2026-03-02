'use client';

import React from 'react';
import Comment from '../ui/Comment';
import { Comment as CommentType } from '@/types/comment';

interface CurrentUser {
  id: number;
  username: string;
  avatar: string | null;
}

interface CommentsListProps {
  comments: CommentType[];
  currentUser: CurrentUser;
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onDelete: (commentId: number) => void;
}

/**
 * 🎯 ИСПРАВЛЕНИЯ:
 * 
 * ✅ Single Responsibility: Только отображение списка комментариев
 * ✅ Презентационный компонент: Получает данные через пропсы
 * ✅ Оптимизация: React.memo предотвращает ненужные re-renders
 * ✅ Loading/Empty states: Четкое разделение состояний
 */
const CommentsList = React.memo(({ 
  comments, 
  currentUser, 
  isLoading, 
  hasMore = false, 
  onLoadMore, 
  onDelete 
}: CommentsListProps) => {
  
  // 📚 ОБУЧЕНИЕ: Компонент загрузки вынесен в отдельную функцию
  const LoadingState = () => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-[#BBBDC0] font-montserrat">Загрузка комментариев...</p>
      </div>
    </div>
  );

  // 📚 ОБУЧЕНИЕ: Empty state вынесен в отдельную функцию для читаемости
  const EmptyState = () => (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#BBBDC0]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-montserrat font-semibold text-white mb-2">No comments yet</h3>
      <p className="text-[#BBBDC0] font-montserrat mb-6">Be the first to share your thoughts!</p>
    </div>
  );

  // 📚 OBУЧЕНИЕ: LoadMore button вынесен в отдельную функцию
  const LoadMoreButton = () => {
    if (!hasMore || !onLoadMore) return null;
    
    return (
      <div className="py-6 text-center mx-4">
        <button
          onClick={onLoadMore}
          className="px-6 py-2 rounded-lg font-montserrat font-medium bg-[#1A1A1A] text-[#BBBDC0] hover:text-white hover:bg-[#2A2A2A] transition-all border border-[#333333]"
        >
          Load more comments
        </button>
      </div>
    );
  };

  // 📚 ОБУЧЕНИЕ: Early returns делают код более читаемым
  if (isLoading) {
    return (
      <div className="bg-black">
        <LoadingState />
      </div>
    );
  }

  return (
    <div>
      {comments.length > 0 ? (
        <div className="space-y-4">
          {/* 📚 ОБУЧЕНИЕ: Используем key для оптимизации React renders */}
          {comments.map((comment) => (
            <Comment
              key={comment.id} // Всегда используем стабильный уникальный key
              comment={comment}
              currentUser={currentUser}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
      
      <LoadMoreButton />
    </div>
  );
});

// 📚 ОБУЧЕНИЕ: Всегда даем memo компонентам displayName для debugging
CommentsList.displayName = 'CommentsList';

export { CommentsList };