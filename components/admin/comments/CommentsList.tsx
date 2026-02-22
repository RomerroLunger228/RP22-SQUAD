/**
 * Список комментариев для модерации
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение всех комментариев пользователей
 * - Возможность удаления комментариев
 * - Информация об авторе комментария
 * - Адаптивная верстка для разных экранов
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Comment } from '@/types/admin';
import UserAvatar from '@/components/ui/UserAvatar';

interface CommentsListProps {
  comments: Comment[];
  onDeleteComment: (commentId: number) => void;
  loading?: boolean;
}

/**
 * Компонент карточки комментария
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Аватар пользователя с первой буквой имени
 * - Имя пользователя и содержимое комментария
 * - Кнопка удаления с подтверждением
 * - Сохранение переносов строк в тексте
 */
interface CommentCardProps {
  comment: Comment;
  onDeleteComment: (commentId: number) => void;
}

const CommentCard: React.FC<CommentCardProps> = React.memo(({
  comment,
  onDeleteComment
}) => {
  return (
    <div className="bg-[#1A1A1A] rounded-[12px] p-4 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Аватар пользователя */}
          <UserAvatar
            username={comment.username}
            avatar_url={comment.avatar_url}
            size="medium"
          />
          
          <div className="flex-1 min-w-0">
            {/* Имя пользователя */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-montserrat font-semibold text-white">
                @{comment.username}
              </span>
              {comment.created_at && (
                <span className="text-[#BBBDC0] text-xs font-montserrat">
                  {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
            
            {/* Содержимое комментария */}
            <p className="text-white font-montserrat mb-3 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
        </div>
        
        {/* Кнопка удаления */}
        <button
          onClick={() => onDeleteComment(comment.id)}
          className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 text-sm font-montserrat font-medium rounded-lg transition-colors flex-shrink-0 ml-3"
          aria-label={`Удалить комментарий от ${comment.username}`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Удалить</span>
        </button>
      </div>
    </div>
  );
});

CommentCard.displayName = 'CommentCard';

/**
 * Основной компонент списка комментариев
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Заголовок страницы
 * - Список комментариев или пустое состояние
 * - Загрузочные состояния
 * - Обработка пустого списка
 */
const CommentsList: React.FC<CommentsListProps> = React.memo(({
  comments,
  onDeleteComment,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-montserrat font-semibold text-white mb-4">
          Управление комментариями
        </h2>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index}
              className="bg-[#1A1A1A] rounded-[12px] p-4 border border-[#2A2A2A] animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-gray-600 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-montserrat font-semibold text-white mb-4">
        Управление комментариями
      </h2>
      
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-600/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white font-montserrat font-semibold text-lg mb-2">
            Комментариев пока нет
          </h3>
          <p className="text-[#BBBDC0] font-montserrat">
            Когда пользователи оставят отзывы, они появятся здесь
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
});

CommentsList.displayName = 'CommentsList';

export default CommentsList;