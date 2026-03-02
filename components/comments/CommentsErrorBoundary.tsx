'use client';

import React from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';

/**
 * 🎯 СПЕЦИФИЧНЫЙ ERROR BOUNDARY ДЛЯ КОММЕНТАРИЕВ
 * 
 * 📚 ЗАЧЕМ ОТДЕЛЬНЫЙ:
 * - Кастомное сообщение для пользователей
 * - Специфичная обработка ошибок комментариев 
 * - Возможность восстановления без перезагрузки всей страницы
 * - Логирование ошибок с контекстом "comments"
 * 
 * 📚 ПРИНЦИП КОМПОЗИЦИИ:
 * Мы не наследуем ErrorBoundary, а используем его как обёртку
 * Это позволяет переиспользовать базовую логику
 */

interface CommentsErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * 🎨 КАСТОМНЫЙ FALLBACK ДЛЯ КОММЕНТАРИЕВ
 * 
 * 📚 ОБУЧЕНИЕ: Почему отдельный fallback?
 * - Пользователь понимает что сломались именно комментарии
 * - Можно предложить альтернативные действия
 * - Сохраняем контекст использования
 */
function CommentsFallback({ 
  error, 
  reset 
}: { 
  error?: Error; 
  reset: () => void; 
}) {
  console.log('🎨 Рендер CommentsFallback для комментариев');

  return (
    <div className="bg-black border border-yellow-500/20 rounded-xl p-6 mx-4 my-6">
      <div className="text-center">
        {/* 📚 ОБУЧЕНИЕ: Иконка специфичная для комментариев */}
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </div>
        
        {/* 📚 ОБУЧЕНИЕ: Специфичное сообщение */}
        <h3 className="text-lg font-montserrat font-bold text-white mb-2">
          Комментарии временно недоступны
        </h3>
        
        <p className="text-[#BBBDC0] font-montserrat mb-4 text-sm">
          Возникла проблема при загрузке комментариев. 
          Остальные функции приложения работают нормально.
        </p>
        
        {/* 📚 ОБУЧЕНИЕ: Специфичные действия для комментариев */}
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-white text-black rounded-lg font-montserrat font-medium hover:bg-gray-100 transition-colors"
          >
            Попробовать загрузить снова
          </button>
          
          <p className="text-xs text-[#888888] font-montserrat">
            Или обновите страницу, если проблема повторяется
          </p>
        </div>

        {/* 📚 ОБУЧЕНИЕ: Детали ошибки только в development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mt-4">
            <summary className="text-yellow-400 cursor-pointer font-mono text-sm mb-2">
              🐛 Детали ошибки комментариев (dev only)
            </summary>
            <pre className="text-yellow-200 text-xs overflow-auto bg-yellow-950/50 p-2 rounded">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * 🛡️ ОСНОВНОЙ КОМПОНЕНТ CommentsErrorBoundary
 * 
 * 📚 ОБУЧЕНИЕ: Функция логирования ошибок
 * Можно добавить специфичную обработку для ошибок комментариев
 */
function handleCommentsError(error: Error, errorInfo: React.ErrorInfo) {
  console.group('💬 CommentsErrorBoundary: Ошибка в секции комментариев');
  console.error('Ошибка:', error.message);
  console.error('Компонент:', errorInfo.componentStack);
  
  // 📚 ОБУЧЕНИЕ: Можно добавить специфичную логику
  if (error.message.includes('Cannot read property')) {
    console.warn('🔍 Вероятно проблема с данными комментариев от API');
  }
  
  if (error.message.includes('undefined is not a function')) {
    console.warn('🔍 Вероятно проблема с хуками или функциями');
  }
  
  console.groupEnd();

  // 📚 ОБУЧЕНИЕ: В production можно отправить с тегом "comments"
  // analytics.track('comment_error', { 
  //   error: error.message, 
  //   component: 'CommentsSection' 
  // });
}

export function CommentsErrorBoundary({ children }: CommentsErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={CommentsFallback}
      onError={handleCommentsError}
      resetOnPropsChange={true} // 📚 Автосброс при навигации
    >
      {children}
    </ErrorBoundary>
  );
}