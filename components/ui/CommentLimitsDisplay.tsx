"use client";

import { useCanCreateComment } from '@/hooks/useCommentLimits';

interface CommentLimitsDisplayProps {
  className?: string;
}

export function CommentLimitsDisplay({ className = '' }: CommentLimitsDisplayProps) {
  const { 
    canComment, 
    availableComments, 
    isLoading 
  } = useCanCreateComment();

  if (isLoading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">
          Доступно комментариев: {availableComments}
        </span>
      </div>
      
      {!canComment && (
        <div className="mt-1 text-xs text-red-400">
          Завершите записи для создания комментариев
        </div>
      )}
    </div>
  );
}