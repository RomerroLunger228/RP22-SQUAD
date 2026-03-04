// ОБУЧАЮЩИЙ ПРИМЕР: Извлечение сложной логики модалки пользователя
// 
// ПРИНЦИП РАЗДЕЛЕНИЯ ОТВЕТСТВЕННОСТИ:
// Этот хук содержит ВСЮ бизнес-логику для работы с пользователем и подписками
// 
// ИЗВЛЕЧЕНО ИЗ: UserModal.tsx строки 76-181
// ОТВЕТСТВЕННОСТЬ: API запросы, мутации, состояние модалки

"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, createQueryKey } from '@/lib/axios';
import { User } from '@/types/admin';

// СТРОГИЕ ТИПЫ - точно такие же как в оригинале
interface SubscriptionPlan {
  id: number;
  service: {
    id: number;
    name: string;
    price: number;
  };
  service_type: string;
  duration_months: number;
  price: number;
  discount_percentage: number;
  free_visits_count: number;
}

interface SubscriptionTier {
  id: number;
  title: string;
  description: string;
  plans: SubscriptionPlan[];
}

interface Subscription {
  id: number;
  plan: {
    id: number;
    tier_name: string;
    service_name: string;
    service_type: string;
    discount_percentage: number;
    free_visits_count: number;
    duration_months: number;
    price: number;
    currency: string;
  };
  free_visits_remaining: number;
  free_visits_used: number;
  expires_at: string;
  status: string;
}

interface UserSubscriptionResponse {
  hasSubscription: boolean;
  subscription?: Subscription;
}

interface SubscriptionPlansResponse {
  tiers: SubscriptionTier[];
}

interface CreateSubscriptionRequest {
  userId: number;
  planId: number;
}

interface CreateSubscriptionResponse {
  success: boolean;
  error?: string;
}

export function useUserModal(user: User | null, isOpen: boolean, onDataChange?: () => Promise<void>) {
  // ЛОКАЛЬНОЕ СОСТОЯНИЕ - точно такое же как в оригинале (строки 77-78)
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const queryClient = useQueryClient();

  // ЗАГРУЗКА ПОДПИСКИ ПОЛЬЗОВАТЕЛЯ - точно такой же запрос (строки 81-98)
  const { 
    data: subscriptionData, 
    isLoading: subscriptionLoading,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: createQueryKey('user-subscription', { userId: user?.id }),
    queryFn: async (): Promise<UserSubscriptionResponse> => {
      if (!user) throw new Error('User not provided');
      const response = await apiClient.get<UserSubscriptionResponse>(`/api/user/subscription?userId=${user.id}`);
      return response.data;
    },
    enabled: Boolean(isOpen && user),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // ЗАГРУЗКА ПЛАНОВ ПОДПИСКИ - точно такой же запрос (строки 101-112)
  const { 
    data: plansData, 
    isLoading: plansLoading 
  } = useQuery({
    queryKey: createQueryKey('subscription-plans'),
    queryFn: async (): Promise<SubscriptionPlansResponse> => {
      const response = await apiClient.get<SubscriptionPlansResponse>('/api/subscription-plans');
      return response.data;
    },
    enabled: showAddSubscription,
    staleTime: 5 * 60 * 1000,
  });

  // ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ - точно такие же (строки 114-115)
  const subscription = subscriptionData?.hasSubscription ? subscriptionData.subscription : null;
  const availablePlans = plansData?.tiers || [];

  // МУТАЦИЯ ДЛЯ УДАЛЕНИЯ ПОДПИСКИ - точно такая же (строки 118-139)
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiClient.delete(`/api/admin/subscription/${subscriptionId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Подписка удалена');
      queryClient.invalidateQueries({ 
        queryKey: ['user-subscription', { userId: user?.id }]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      refetchSubscription();
      onDataChange?.();
    },
    onError: (error: Error) => {
      toast.error('Ошибка при удалении подписки');
    }
  });

  // МУТАЦИЯ ДЛЯ СОЗДАНИЯ ПОДПИСКИ - точно такая же (строки 142-164)
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> => {
      const response = await apiClient.post<CreateSubscriptionResponse>('/api/admin/subscription/create', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Подписка добавлена');
      setShowAddSubscription(false);
      queryClient.invalidateQueries({ 
        queryKey: ['user-subscription', { userId: user?.id }]
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      refetchSubscription();
      onDataChange?.();
    },
    onError: (error: Error) => {
      toast.error('Ошибка при добавлении подписки');
    }
  });

  // ОБРАБОТЧИКИ СОБЫТИЙ - точно такие же (строки 166-181)
  const handleDeleteSubscription = () => {
    if (!subscription) return;
    deleteSubscriptionMutation.mutate(subscription.id);
  };

  const handleShowAddSubscription = () => {
    setShowAddSubscription(true);
  };

  const handleCreateSubscription = (planId: number) => {
    if (!user) return;
    createSubscriptionMutation.mutate({
      userId: user.id,
      planId
    });
  };

  const handleCloseAddSubscription = () => {
    setShowAddSubscription(false);
  };

  // ВОЗВРАЩАЕМ API ХУКА - все что нужно компонентам
  return {
    // Основные данные
    subscription,
    availablePlans,
    
    // Состояния загрузки
    subscriptionLoading,
    plansLoading,
    
    // Состояние UI
    showAddSubscription,
    
    // Действия
    handleDeleteSubscription,
    handleShowAddSubscription,
    handleCreateSubscription,
    handleCloseAddSubscription,
    
    // Состояния мутаций
    isDeleting: deleteSubscriptionMutation.isPending,
    isCreating: createSubscriptionMutation.isPending,
  } as const;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 
// ЗАЧЕМ ВЫНОСИТЬ В ХУК:
// 1. ТЕСТИРУЕМОСТЬ: Можно тестировать логику отдельно от UI
// 2. ПЕРЕИСПОЛЬЗУЕМОСТЬ: Хук можно использовать в других компонентах управления пользователями  
// 3. ЧИТАЕМОСТЬ: Компонент становится декларативным
// 4. ПОДДЕРЖКА: Вся сложная логика в одном месте
// 5. РАЗДЕЛЕНИЕ ОТВЕТСТВЕННОСТИ: Хук - логика, компонент - UI