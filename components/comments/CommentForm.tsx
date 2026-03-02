'use client';

import React from 'react';
import Image from 'next/image';
import { CommentLimitsDisplay } from '../ui/CommentLimitsDisplay';

interface CurrentUser {
  id: number;
  username: string;
  avatar: string | null;
}

interface CommentFormProps {
  currentUser: CurrentUser;
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
  canComment: boolean;
  availableComments: number;
}

/**
 * 🎯 ИСПРАВЛЕНИЕ ПРОБЛЕМ:
 * 
 * ✅ Single Responsibility: Только форма добавления комментария
 * ✅ Переиспользуемый: Можно использовать в любом месте
 * ✅ Тестируемый: Простые пропсы, легко мокать
 * ✅ Controlled component: Родитель управляет состоянием
 */
export function CommentForm({ 
  currentUser, 
  onSubmit, 
  isSubmitting, 
  canComment, 
  availableComments 
}: CommentFormProps) {
  const [content, setContent] = React.useState('');

  // 📚 ОБУЧЕНИЕ: Локальный обработчик - простая функция без сайд-эффектов
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !canComment) return;
    
    onSubmit(content.trim());
    setContent(''); // Очищаем форму только после успешной отправки
  };

  // 📚 ОБУЧЕНИЕ: Выделяем повторяющуюся логику аватара в отдельный компонент
  const UserAvatar = () => (
    <div className="relative">
      {currentUser.avatar ? (
        <Image
          src={currentUser.avatar}
          alt={currentUser.username}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
        />
      ) : (
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-lg"
          style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
        >
          {currentUser.username.charAt(0)}
        </div>
      )}
      <div 
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center"
        style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
      >
        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-4 mb-6">
      <div className="flex items-start gap-3">
        {/* 📚 ОБУЧЕНИЕ: Переиспользуемый компонент аватара */}
        <div className="flex-shrink-0">
          <UserAvatar />
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-[#1A1A1A] text-white placeholder-[#BBBDC0] px-4 py-3 pr-32 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#7AB069] focus:border-transparent border border-[#2A2A2A] font-montserrat"
                rows={3}
                disabled={isSubmitting || !canComment}
                maxLength={350}
              />
              
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting || !canComment}
                  className={`px-6 py-2 rounded-lg font-montserrat font-medium transition-all duration-300 ${
                    !content.trim() || isSubmitting || !canComment
                      ? 'bg-[#2A2A2A] text-[#BBBDC0] cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Post Comment
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* 📚 ОБУЧЕНИЕ: Компонент остается изолированным, но показывает лимиты */}
            <div className="mt-3">
              <CommentLimitsDisplay className="text-xs" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}