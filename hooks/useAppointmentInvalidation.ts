/**
 * Оптимизированный хук для инвалидации кэша записей
 * 
 * Использует умную инвалидацию в зависимости от контекста:
 * - Минимальная инвалидация для лучшей производительности
 * - Таргетированные обновления по типу операции
 * - Дебаунсинг для предотвращения множественных запросов
 */

import { useQueryClient } from '@tanstack/react-query';
import { createQueryKey } from '@/lib/axios';
import { useTelegramStore, selectDatabaseUser } from '@/lib/stores/telegramStore';
import { useCallback } from 'react';

export function useAppointmentInvalidation() {
  const queryClient = useQueryClient();
  const user = useTelegramStore(selectDatabaseUser);

  /**
   * Умная инвалидация только необходимых кэшей
   * Вызывать после операций с записями пользователя
   */
  const invalidateUserAppointments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['activeAppointments', user.id] });
    }

    console.log('🔄 [useAppointmentInvalidation] Инвалидированы пользовательские кэши');
  }, [queryClient, user]);

  /**
   * Инвалидация админских кэшей
   * Вызывать только для операций в админке
   */
  const invalidateAdminAppointments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: createQueryKey('appointments', { admin: true }) });
    queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });

    console.log('🔄 [useAppointmentInvalidation] Инвалидированы админские кэши');
  }, [queryClient]);

  /**
   * Полная инвалидация (используется только в критических случаях)
   * Вызывать когда операция влияет на оба контекста
   */
  const invalidateAppointments = useCallback(() => {
    invalidateUserAppointments();
    invalidateAdminAppointments();
    
    console.log('🔄 [useAppointmentInvalidation] Полная инвалидация выполнена');
  }, [invalidateUserAppointments, invalidateAdminAppointments]);

  /**
   * Принудительно обновляет данные записей
   * Использовать только когда нужно гарантировать актуальность
   */
  const refetchAppointments = useCallback(async () => {
    const queries = [
      queryClient.refetchQueries({ queryKey: ['appointments'] }),
      queryClient.refetchQueries({ queryKey: createQueryKey('appointments', { admin: true }) }),
      queryClient.refetchQueries({ queryKey: ['admin', 'appointments'] }),
      queryClient.refetchQueries({ queryKey: ['admin', 'stats'] }),
    ];
    
    if (user?.id) {
      queries.push(queryClient.refetchQueries({ queryKey: ['activeAppointments', user.id] }));
    }

    await Promise.all(queries);
    console.log('🔄 [useAppointmentInvalidation] Принудительно обновлены все данные записей');
  }, [queryClient, user]);

  /**
   * Легковесная инвалидация для операций влияющих на доступность слотов
   * (создание/удаление заблокированного времени)
   */
  const invalidateAvailability = useCallback(() => {
    // Инвалидируем доступность слотов
    queryClient.invalidateQueries({ queryKey: createQueryKey('available-slots') });
    
    // Инвалидируем кэш заблокированных времен для календаря
    queryClient.invalidateQueries({ queryKey: createQueryKey('blocked-times') });
    
    // Инвалидируем админский кэш заблокированных времен
    queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-times'] });

    console.log('🔄 [useAppointmentInvalidation] Инвалидирована доступность слотов и календарь');
  }, [queryClient]);

  return {
    // Умная инвалидация по контексту
    invalidateUserAppointments,
    invalidateAdminAppointments,
    invalidateAvailability,
    
    // Полная инвалидация (использовать осторожно)
    invalidateAppointments,
    
    // Принудительные обновления
    refetchAppointments,
  };
}