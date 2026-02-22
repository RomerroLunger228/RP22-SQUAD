'use client';

/**
 * TanStack Query Provider для приложения
 * 
 * Настройки:
 * - Кеширование на 5 минут по умолчанию
 * - Автоматический refetch при фокусе окна
 * - Retry логика для failed запросов
 * - DevTools в development режиме
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные считаются свежими 5 минут
            staleTime: 5 * 60 * 1000, // 5 минут
            // Кеш храним 10 минут
            gcTime: 10 * 60 * 1000, // 10 минут (было cacheTime)
            // Повторный запрос при фокусе окна
            refetchOnWindowFocus: true,
            // Повторный запрос при переподключении
            refetchOnReconnect: true,
            // Количество попыток при ошибке
            retry: (failureCount, error) => {
              // Не повторяем для 4xx ошибок (кроме 408, 429)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = error.status as number;
                if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
                  return false;
                }
              }
              // Максимум 3 попытки
              return failureCount < 3;
            },
            // Задержка между попытками (экспоненциальная)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Не повторяем мутации по умолчанию
            retry: false,
            // Показываем ошибки через toast (настроено в axios interceptors)
            onError: (error) => {
              console.error('Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools только в development */}
      
    </QueryClientProvider>
  );
}

export default QueryProvider;