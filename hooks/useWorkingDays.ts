import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/axios';

interface WorkingDay {
  id: number;
  date: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface WorkingDaysResponse {
  success: boolean;
  data: WorkingDay[];
}

export function useWorkingDays() {
  const { data, isLoading, error, refetch, dataUpdatedAt, isError } = useQuery({
    queryKey: ['working-days', 'all'],
    queryFn: async (): Promise<WorkingDay[]> => {
      console.log('📡 [WORKING_DAYS_HOOK] Fetching working days from API');
      const response = await apiClient.get<WorkingDaysResponse>('/api/work-days/all');
      console.log(`✅ [WORKING_DAYS_HOOK] Successfully loaded ${response.data.data.length} working days`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут кеш
    gcTime: 10 * 60 * 1000, // 10 минут в памяти (было cacheTime)
    retry: 3, // 🛡️ Повторяем запрос до 3 раз при ошибке
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Экспоненциальная задержка: 1с, 2с, 4с
  });

  // 🕒 Вычисляем cacheAge через useState + useEffect (избегаем Date.now() в render)
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Обновляем каждые 30 секунд
    
    return () => clearInterval(interval);
  }, []);

  // 🔍 Логирование состояния через useEffect
  useEffect(() => {
    if (error && !isLoading) {
      console.error('❌ [WORKING_DAYS_HOOK] Failed to load working days:', error);
    }
  }, [error, isLoading]);

  useEffect(() => {
    if (data && !isLoading) {
      console.log(`🎯 [WORKING_DAYS_HOOK] Cache updated with ${data.length} working days`);
    }
  }, [data, isLoading]);

  // Создаем Map для быстрого поиска по дате
  const workingDaysMap = new Map<string, WorkingDay>();
  data?.forEach(day => {
    workingDaysMap.set(day.date, day);
  });

  // 🛡️ Graceful fallback при ошибках загрузки
  const isWorkingDay = (date: string): boolean => {
    if (isError || (!data && !isLoading)) {
      console.warn(`⚠️ [WORKING_DAYS_HOOK] Cache unavailable for ${date}, using fallback (allowing booking attempt)`);
      // FALLBACK: При ошибке загрузки разрешаем попытку записи
      // API сам разберется через DB fallback
      return true;
    }
    
    const workingDay = workingDaysMap.get(date);
    return workingDay?.is_working ?? false; // По умолчанию выходной если день найден но is_working = false
  };

  const getWorkingHours = (date: string): { start_time: string | null; end_time: string | null } | null => {
    if (isError || (!data && !isLoading)) {
      console.warn(`⚠️ [WORKING_DAYS_HOOK] Cache unavailable for ${date}, returning null (API will use DB fallback)`);
      return null; // API сделает DB запрос
    }
    
    const workingDay = workingDaysMap.get(date);
    if (!workingDay?.is_working) return null;
    
    return {
      start_time: workingDay.start_time,
      end_time: workingDay.end_time
    };
  };

  const isDateConfigured = (date: string): boolean => {
    if (isError || (!data && !isLoading)) {
      // FALLBACK: Если кеш недоступен, считаем что день может быть настроен
      return true;
    }
    return workingDaysMap.has(date);
  };

  // 🔧 Автоматическое обновление протухшего кеша при ошибках
  const shouldForceRefresh = () => {
    if (!isError) return false;
    
    const cacheAge = currentTime - (dataUpdatedAt || 0);
    const cacheIsStale = cacheAge > 10 * 60 * 1000; // 10 минут
    
    return cacheIsStale;
  };

  return {
    workingDays: data || [],
    workingDaysMap,
    isWorkingDay,
    getWorkingHours,
    isDateConfigured,
    isLoading,
    error,
    refetch,
    shouldForceRefresh,
    cacheStatus: useMemo(() => ({
      hasData: !!data,
      isError,
      cacheAge: dataUpdatedAt ? currentTime - dataUpdatedAt : null
    }), [data, isError, dataUpdatedAt, currentTime])
  };
}