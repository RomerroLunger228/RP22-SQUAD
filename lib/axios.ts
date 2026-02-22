/**
 * Настройка Axios для всего приложения
 * 
 * Функциональность:
 * - Базовый URL и заголовки
 * - Interceptors для обработки ошибок
 * - Автоматические повторы запросов
 * - Логирование в development режиме
 * - Полная типизация без any
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Типы для конфигурации с повторными попытками
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Типы для API ошибок
interface ApiErrorData {
  message?: string;
  error?: string;
  detail?: string;
  errors?: Array<{ message?: string } | string>;
}

// Создаем основной экземпляр axios
export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000',
  timeout: 15000, // 15 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Счетчик для повторных попыток
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 секунда

/**
 * Request interceptor для логирования и добавления авторизации
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {

    // Автоматическое добавление Telegram токена авторизации (опционально)
    if (typeof window !== 'undefined') {
      try {
        const telegramStore = localStorage.getItem('telegram-store');
        if (telegramStore) {
          const store = JSON.parse(telegramStore);
          const token = store.state?.authToken || store.authToken; // Поддерживаем оба варианта
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        // Не критично если не удалось получить токен
        console.warn('Could not get auth token:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return config;
  },
  (error: AxiosError): Promise<never> => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor для обработки ответов и ошибок
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {

    return response;
  },
  async (error: AxiosError): Promise<never> => {
    const originalRequest = error.config as RetryConfig;


    // Повторные попытки для сетевых ошибок (не для HTTP ошибок)
    if (
      !error.response && // Сетевая ошибка
      originalRequest &&
      !originalRequest._retry &&
      (originalRequest._retryCount || 0) < MAX_RETRIES
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Задержка перед повтором
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (originalRequest._retryCount || 0)));

      return apiClient(originalRequest);
    }

    // Обработка HTTP ошибок
    if (error.response) {
      const status = error.response.status;
      const message = getErrorMessage(error);

      switch (status) {
        case 400:
          toast.error('Неверный запрос');
          break;
        case 401:
          toast.error('Необходима авторизация');
          // Здесь можно добавить редирект на страницу входа
          break;
        case 403:
          toast.error('Доступ запрещен');
          break;
        case 404:
          toast.error('Ресурс не найден');
          break;
        case 422:
          toast.error('Ошибка валидации данных');
          break;
        case 500:
          toast.error('Ошибка сервера');
          break;
        default:
          toast.error(message);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Превышено время ожидания');
    } else {
      toast.error('Проблемы с соединением');
    }

    return Promise.reject(error);
  }
);

/**
 * Извлекает понятное сообщение об ошибке
 */
function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as ApiErrorData;
    
    // Стандартные поля с сообщениями об ошибках
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    
    // Если это валидационные ошибки
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((err) => 
        typeof err === 'string' ? err : err.message || 'Ошибка валидации'
      ).join(', ');
    }
  }

  return error.message || 'Произошла ошибка';
}

/**
 * Типы для API ответов
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Типы для создания query keys
 */
export type QueryKeyParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Вспомогательная функция для создания query keys
 */
export const createQueryKey = (endpoint: string, params?: QueryKeyParams): [string, QueryKeyParams?] => {
  if (params) {
    return [endpoint, params];
  }
  return [endpoint];
};

export default apiClient;