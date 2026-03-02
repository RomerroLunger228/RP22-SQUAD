'use client';

import React from 'react';

/**
 * 📚 ОБУЧЕНИЕ: Типы для Error Boundary
 * 
 * ErrorInfo - содержит информацию о том, где именно произошла ошибка
 * componentStack - показывает стек компонентов React где произошла ошибка
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  reset: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

/**
 * 🛡️ БАЗОВЫЙ ERROR BOUNDARY КОМПОНЕНТ
 * 
 * 📚 ЗАЧЕМ НУЖЕН:
 * - React Error Boundaries ловят ошибки во время рендера
 * - Ошибки в event handlers, async код (useEffect) НЕ ловятся
 * - Предотвращают "белый экран смерти"
 * - Позволяют показать fallback UI
 * 
 * 📚 ЧТО ЛОВИТ:
 * ✅ Ошибки в render методах
 * ✅ Ошибки в lifecycle методах
 * ✅ Ошибки в конструкторах
 * ✅ TypeError, ReferenceError в компонентах
 * 
 * 📚 ЧТО НЕ ЛОВИТ:
 * ❌ Event handlers (onClick, onChange)
 * ❌ Async код (setTimeout, promises)
 * ❌ Ошибки в самом Error Boundary
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 📚 ОБУЧЕНИЕ: getDerivedStateFromError
   * 
   * Этот статический метод вызывается когда дочерний компонент выбрасывает ошибку
   * Он получает ошибку как параметр и должен вернуть объект для обновления state
   * 
   * ВАЖНО: Этот метод вызывается во время рендера, поэтому side effects запрещены
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.log('📊 ErrorBoundary: getDerivedStateFromError вызван', error.message);
    
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 📚 ОБУЧЕНИЕ: componentDidCatch
   * 
   * Этот метод вызывается когда дочерний компонент выбросил ошибку
   * Здесь можно выполнять side effects: логирование, отправка ошибок в сервисы мониторинга
   * 
   * errorInfo.componentStack - показывает стек компонентов где произошла ошибка
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 ErrorBoundary поймал ошибку');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Сохраняем errorInfo в state для отображения в fallback
    this.setState({ errorInfo });
    
    // 📚 ОБУЧЕНИЕ: Вызываем callback если предоставлен (для логирования)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 📚 ОБУЧЕНИЕ: В production здесь была бы отправка в сервис мониторинга
    if (process.env.NODE_ENV === 'production') {
      // Например: Sentry.captureException(error, { extra: errorInfo });
      console.log('🔄 В production здесь была бы отправка в Sentry/LogRocket');
    }
  }

  /**
   * 📚 ОБУЧЕНИЕ: componentDidUpdate для автосброса
   * 
   * Если resetOnPropsChange=true, сбрасываем ошибку при изменении props
   * Полезно когда пользователь навигирует на другую страницу
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      console.log('🔄 ErrorBoundary: Автосброс из-за изменения children');
      this.reset();
    }
  }

  /**
   * 📚 ОБУЧЕНИЕ: Функция сброса ошибки
   * 
   * Позволяет пользователю "попробовать снова" без перезагрузки страницы
   * Очищает state и позволяет компоненту попробовать заново отрендериться
   */
  reset = () => {
    console.log('🔄 ErrorBoundary: Сброс ошибки');
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback: FallbackComponent, children } = this.props;

    if (hasError) {
      console.log('🎨 ErrorBoundary: Рендер fallback UI');
      
      // 📚 ОБУЧЕНИЕ: Используем кастомный fallback если предоставлен
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={error} 
            errorInfo={errorInfo}
            reset={this.reset} 
          />
        );
      }

      // 📚 ОБУЧЕНИЕ: Иначе используем дефолтный fallback
      return (
        <DefaultErrorFallback 
          error={error} 
          errorInfo={errorInfo}
          reset={this.reset} 
        />
      );
    }

    // 📚 ОБУЧЕНИЕ: Если ошибок нет, рендерим детей как обычно
    return children;
  }
}

/**
 * 🎨 ДЕФОЛТНЫЙ FALLBACK КОМПОНЕНТ
 * 
 * 📚 ОБУЧЕНИЕ: Этот компонент показывается когда произошла ошибка
 * Он должен быть простым и надежным, без сложной логики
 */
function DefaultErrorFallback({ error, errorInfo, reset }: ErrorFallbackProps) {
  console.log('🎨 Рендер DefaultErrorFallback');

  return (
    <div className="bg-black border border-red-500/20 rounded-xl p-6 m-4">
      <div className="text-center">
        {/* 📚 ОБУЧЕНИЕ: Иконка ошибки */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        {/* 📚 ОБУЧЕНИЕ: Заголовок понятный для пользователя */}
        <h3 className="text-lg font-montserrat font-bold text-white mb-2">
          Что-то пошло не так
        </h3>
        
        {/* 📚 ОБУЧЕНИЕ: Объяснение для пользователя */}
        <p className="text-[#BBBDC0] font-montserrat mb-4 text-sm">
          Произошла неожиданная ошибка. Попробуйте обновить страницу или повторить действие.
        </p>
        
        {/* 📚 ОБУЧЕНИЕ: Детали ошибки только в development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-red-900/20 border border-red-500/30 rounded p-3 mb-4">
            <summary className="text-red-400 cursor-pointer font-mono text-sm mb-2">
              🐛 Детали ошибки (только в разработке)
            </summary>
            <div className="space-y-2">
              <div>
                <strong className="text-red-300">Ошибка:</strong>
                <pre className="text-red-200 text-xs mt-1 overflow-auto bg-red-950/50 p-2 rounded">
                  {error.message}
                </pre>
              </div>
              
              {error.stack && (
                <div>
                  <strong className="text-red-300">Stack trace:</strong>
                  <pre className="text-red-200 text-xs mt-1 overflow-auto bg-red-950/50 p-2 rounded max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
              
              {errorInfo?.componentStack && (
                <div>
                  <strong className="text-red-300">Component stack:</strong>
                  <pre className="text-red-200 text-xs mt-1 overflow-auto bg-red-950/50 p-2 rounded max-h-32">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
        
        {/* 📚 ОБУЧЕНИЕ: Кнопка восстановления */}
        <button
          onClick={reset}
          className="px-6 py-2 bg-white text-black rounded-lg font-montserrat font-medium hover:bg-gray-100 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}