'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SubscriptionPlansResponse, SubscriptionPlan } from '@/types/subscription';
import { MembershipCard } from './MembershipCard';
import MembershipDescription from './MembershipDescription';
import { useTelegramStore, selectDatabaseUser } from '@/lib/stores/telegramStore';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/axios';

export default function SubscriptionPlansGrid() {
  const user = useTelegramStore(selectDatabaseUser);
  
  // ВАЖНО: Все hooks должны быть вызваны ДО любых условных returns
  const [premiumHaircutDuration, setPremiumHaircutDuration] = useState<1 | 3>(1);
  const [premiumHaircutBeardDuration, setPremiumHaircutBeardDuration] = useState<1 | 3>(1);
  const [defaultHaircutDuration, setDefaultHaircutDuration] = useState<1 | 3>(1);
  const [defaultHaircutBeardDuration, setDefaultHaircutBeardDuration] = useState<1 | 3>(1);

  const { data: subscriptionData, isLoading: loading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlansResponse> => {
      const response = await apiClient.get<SubscriptionPlansResponse>('/api/subscription-plans');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user, // Включаем только когда есть пользователь
  });

  const tiers = subscriptionData?.tiers || [];

  const purchaseMutation = useMutation({
    mutationFn: async ({ planId, userId }: { planId: number; userId: number }) => {
      console.log('Attempting purchase with:', { planId, userId });
      const response = await apiClient.post('/api/subscription/purchase', { planId, userId });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Purchase success:', data);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error('Не удалось получить ссылку для оплаты');
      }
    },
    onError: (error: Error) => {
      console.error('Error purchasing subscription:', error);
      
      // Проверяем, является ли ошибка axios ошибкой с response
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error;
      
      if (errorMessage === 'User already has an active subscription') {
        toast.error('У вас уже есть активная подписка', {
          duration: 4000,
          position: 'top-center',
        });
      } else if (errorMessage === 'Subscription plan not found') {
        toast.error('План подписки не найден', {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        toast.error('Не удалось создать сессию оплаты', {
          duration: 4000,
          position: 'top-center',
        });
      }
    },
  });

  const handlePurchase = (planId: number) => {
    if (!user) return;
    purchaseMutation.mutate({ planId, userId: user.id });
  };

  // const findPlanByDurationAndTier = (tierTitle: string, duration: 1 | 3): SubscriptionPlan | null => {
  //   const tier = tiers.find(t => t.title.toLowerCase().includes(tierTitle.toLowerCase()));
  //   if (!tier) return null;
  //   
  //   const plan = tier.plans.find(plan => plan.duration_months === duration);
  //   return plan || tier.plans[0] || null;
  // };

  const getServiceName = (plan: SubscriptionPlan): string => {
    if (plan.service && plan.service.name) {
      return plan.service.name.trim();
    }
    
    switch (plan.service_type) {
      case 'haircut':
        return 'Стрижка';
      case 'haircut_beard':
        return 'Стрижка + борода';
      default:
        return plan.service_type;
    }
  };

  const getDurationText = (months: number): string => {
    if (months === 1) return '1 month';
    if (months === 3) return '3 month';
    return `${months} month`;
  };

  // const getDescriptionText = (plan: SubscriptionPlan | null): string => {
  //   if (!plan) return '';
  //   
  //   return `• ${plan.free_visits_count} бесплатных визита в начале\n• ${plan.discount_percentage}% скидка на все последующие визиты\n• Действует ${plan.duration_months === 1 ? '1 месяц' : '3 месяца'}\n• Автоматическое истечение`;
  // };

  const getDescriptionTextWithService = (plan: SubscriptionPlan): string => {
    const serviceName = getServiceName(plan);
    const visitsText = plan.free_visits_count === 1 
      ? `${plan.free_visits_count} визит уже в подписке со скидкой`
      : `${plan.free_visits_count} визита уже в подписке со скидкой`;
    return `Подписка на услугу: ${serviceName}\n\n• ${visitsText}\n• ${plan.discount_percentage}% скидка на все последующие визиты\n• Действует ${plan.duration_months === 1 ? '1 месяц' : '3 месяца'}\n• Автоматическое истечение`;
  };

  const renderSubscriptionCard = (
    tierName: string,
    cardType: 'gold' | 'purple',
    plan: SubscriptionPlan,
    duration: 1 | 3,
    setDuration: (duration: 1 | 3) => void
  ) => {
    const titleStyles = cardType === 'gold' 
      ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] shadow-yellow-500/50' 
      : 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(126,34,206,0.5)] shadow-purple-700/50';

    return (
      <>
        <h2 className={`text-5xl font-bold text-center -mb-6 font-cormorant-garamond italic ${titleStyles}`}>{tierName}</h2>

        <div className="space-y-6 bg-[#101010] border-[#2A2A2A] rounded-lg p-6">
          <div className="text-center relative">
            <div className="flex justify-center -mb-4 mt-6">
              <div className="bg-[#000000]/20 rounded-lg p-0 flex">
                <button
                  onClick={() => setDuration(1)}
                  className={`px-6 py-1 rounded-md text-sm font-medium transition-all ${
                    duration === 1
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  1 month
                </button>
                <button
                  onClick={() => setDuration(3)}
                  className={`px-6 py-1 rounded-md text-sm font-medium transition-all ${
                    duration === 3
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  3 month
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-0 w-full p-1 rounded-lg">
            <MembershipCard
              price={plan.price.toString()}
              interval={getDurationText(plan.duration_months)}
              type={cardType}
              category={getServiceName(plan)}
              maxWidth={600}
              className="w-full"
            />
            
            <MembershipDescription
              text={getDescriptionTextWithService(plan)}
              price={plan.price.toString()}
              duration={plan.duration_months === 1 ? "1 месяц" : "3 месяца"}
              tierType={cardType === 'gold' ? 'premium' : 'default'}
              onBuyClick={() => handlePurchase(plan.id)}
            />
          </div>
        </div>
      </>
    );
  };

  const renderSubscriptionTier = (tierName: string, cardType: 'gold' | 'purple') => {
    const tier = tiers.find(t => t.title.toLowerCase().includes(tierName.toLowerCase()));
    if (!tier) return null;

    // Группируем планы по типу услуги
    const haircutPlans = tier.plans.filter(plan => plan.service_type === 'haircut');
    const haircutBeardPlans = tier.plans.filter(plan => plan.service_type === 'haircut_beard');

    // Определяем состояния для каждой комбинации
    const getHaircutState = () => {
      if (tierName === 'Premium') return [premiumHaircutDuration, setPremiumHaircutDuration] as const;
      return [defaultHaircutDuration, setDefaultHaircutDuration] as const;
    };

    const getHaircutBeardState = () => {
      if (tierName === 'Premium') return [premiumHaircutBeardDuration, setPremiumHaircutBeardDuration] as const;
      return [defaultHaircutBeardDuration, setDefaultHaircutBeardDuration] as const;
    };

    const [haircutDuration, setHaircutDuration] = getHaircutState();
    const [haircutBeardDuration, setHaircutBeardDuration] = getHaircutBeardState();

    return (
      <div className="space-y-8">
        {/* Карточки для стрижки */}
        {haircutPlans.length > 0 && (
          <div>
            {renderSubscriptionCard(
              tierName,
              cardType,
              haircutPlans.find(p => p.duration_months === haircutDuration) || haircutPlans[0],
              haircutDuration,
              setHaircutDuration
            )}
          </div>
        )}

        {/* Карточки для стрижки + борода */}
        {haircutBeardPlans.length > 0 && (
          <div>
            {renderSubscriptionCard(
              tierName,
              cardType,
              haircutBeardPlans.find(p => p.duration_months === haircutBeardDuration) || haircutBeardPlans[0],
              haircutBeardDuration,
              setHaircutBeardDuration
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Не удалось загрузить планы подписок
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full ">
      {renderSubscriptionTier("Premium", "gold")}
      {renderSubscriptionTier("Default", "purple")}
    </div>
  );
}