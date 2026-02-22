/**
 * Хук для управления рабочими часами
 * 
 * SOLID принципы:
 * - Single Responsibility: только управление состоянием рабочих часов
 * - Open/Closed: легко расширяется новой логикой
 * - Dependency Inversion: использует API утилиты
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkingDayForm, WorkingDayValidationErrors } from '@/types/admin';
import { fetchWorkingHours, saveWorkingHours } from '@/utils/working-hours/api';
import { validateWorkingDays, hasValidationErrors } from '@/utils/working-hours/validation';
import { createQueryKey } from '@/lib/axios';

interface UseWorkingHoursReturn {
  workingDays: WorkingDayForm[];
  validationErrors: Record<number, WorkingDayValidationErrors>;
  isLoading: boolean;
  isSaving: boolean;
  saveMessage: { type: 'success' | 'error', text: string } | null;
  updateDay: (updatedDay: WorkingDayForm) => void;
  reload: () => void;
}

export function useWorkingHours(): UseWorkingHoursReturn {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<Record<number, WorkingDayValidationErrors>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Загрузка рабочих часов с React Query
  const { 
    data: workingDays = [], 
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: createQueryKey('working-hours'),
    queryFn: fetchWorkingHours,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Обработка ошибок загрузки
  if (error) {
    console.error('Ошибка загрузки рабочих часов:', error);
    if (!saveMessage || saveMessage.type !== 'error') {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Ошибка загрузки настроек'
      });
    }
  } else if (workingDays.length > 0 && saveMessage?.type === 'error') {
    setSaveMessage(null);
  }

  // Мутация для сохранения рабочих часов
  const saveWorkingHoursMutation = useMutation({
    mutationFn: saveWorkingHours,
    onSuccess: (_, variables) => {
      // Обновляем кеш с новыми данными
      queryClient.setQueryData(createQueryKey('working-hours'), variables);
      
      // Показываем сообщение об успешном сохранении
      setSaveMessage({
        type: 'success',
        text: 'Настройки сохранены'
      });

      // Автоматически скрываем сообщение через 2 секунды
      setTimeout(() => {
        setSaveMessage(null);
      }, 2000);
    },
    onError: (error: Error) => {
      console.error('Ошибка сохранения рабочих часов:', error);
      setSaveMessage({
        type: 'error',
        text: 'Ошибка сохранения. Попробуйте еще раз.'
      });
    }
  });

  const updateDay = (updatedDay: WorkingDayForm) => {
    // Обновляем кеш оптимистично
    const updatedDays = (workingDays as WorkingDayForm[]).map((day: WorkingDayForm) => 
      day.weekday === updatedDay.weekday ? updatedDay : day
    );
    queryClient.setQueryData(createQueryKey('working-hours'), updatedDays);

    // Очищаем ошибки валидации для обновленного дня
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[updatedDay.weekday];
      return newErrors;
    });

    // Очищаем сообщение о сохранении
    setSaveMessage(null);

    // Автосохранение с небольшой задержкой
    saveDay(updatedDay, updatedDays);
  };

  const saveDay = useCallback(async (updatedDay: WorkingDayForm, updatedData: WorkingDayForm[]) => {
    // Валидируем только измененный день
    const errors = validateWorkingDays([updatedDay]);
    
    if (hasValidationErrors(errors)) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      // Откатываем оптимистичное обновление
      queryClient.invalidateQueries({ queryKey: createQueryKey('working-hours') });
      return;
    }

    // Используем мутацию для сохранения
    saveWorkingHoursMutation.mutate(updatedData);
  }, [saveWorkingHoursMutation, queryClient]);

  return {
    workingDays: workingDays as WorkingDayForm[],
    validationErrors,
    isLoading,
    isSaving: saveWorkingHoursMutation.isPending,
    saveMessage,
    updateDay,
    reload: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('working-hours') });
      refetch();
    }
  };
}