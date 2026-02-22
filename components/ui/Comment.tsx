'use client';

import { Comment as CommentType, User } from '@/types/comment';
import Image from 'next/image';

interface CommentProps {
  comment: CommentType;
  currentUser: User;
  onDelete?: (commentId: number) => void;


}

export default function Comment({ 
  comment, 
  currentUser,
  onDelete,
}: CommentProps) {
  

  const canDelete = currentUser.role === 'admin' && onDelete;

  return (
    <div className={`p-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[20px] mx-4 shadow-lg relative overflow-hidden`}>
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-[20px] pointer-events-none"></div>
      
      {/* Основной комментарий */}
      <div className="flex gap-3 relative z-10">
        {/* Аватар */}
        <div className="flex-shrink-0">
          {comment.avatar ? (
            <div className="relative">
              <Image
                src={comment.avatar}
                alt={comment.username}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#333333]"
              />
              
            </div>
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-montserrat font-semibold"
              style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
            >
              {comment.username.charAt(0)}
            </div>
          )}
        </div>
        
        {/* Контент */}
        <div className="flex-1 min-w-0">
          {/* Информация об авторе */}
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <div className="flex items-center gap-1">
              <span className="font-montserrat font-semibold text-white truncate">
                @{comment.username}
                
              </span>
              
            </div>
            
            
          </div>
          
          {/* Текст комментария */}
          
            <p className="text-white font-montserrat mb-3 whitespace-pre-wrap break-words">{comment.content}</p>
          
          
          {/* Действия */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Лайк */}
            
            
            
            
            {/* Редактировать */}
            
            
            {/* Удалить */}
            {canDelete && (
              <button
                onClick={() => onDelete && onDelete(comment.id)}
                className="flex items-center gap-1 text-sm text-[#BBBDC0] hover:text-red-400 transition-colors font-montserrat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            )}
          </div>
          
          {/* Форма ответа */}
          
          
          
          
        </div>
      </div>
    </div>
  );
}