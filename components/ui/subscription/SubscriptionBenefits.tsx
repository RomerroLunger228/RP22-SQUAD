'use client';

import { useQuery } from '@tanstack/react-query';
import { UserSubscriptionResponse } from '@/types/subscription';
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import { apiClient } from '@/lib/axios';

interface SubscriptionBenefitsProps {
  serviceId?: number;
}

interface PriceCalculation {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

export default function SubscriptionBenefits({ serviceId }: SubscriptionBenefitsProps) {
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  
  const { data: subscription, isLoading: loading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscriptionResponse | null> => {
      try {
        const response = await apiClient.get<UserSubscriptionResponse>('/api/user/subscription');
        return response.data;
      } catch (error) {
        console.error('Error fetching user subscription:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user && isAuthenticated, // Включаем только когда есть авторизованный пользователь
  });

  const { data: priceCalculation } = useQuery({
    queryKey: ['price-calculation', user?.id, serviceId],
    queryFn: async (): Promise<PriceCalculation | null> => {
      if (!serviceId) return null;
      
      try {
        const response = await apiClient.post<PriceCalculation>('/api/calculate-price', {
          serviceId
        });
        return response.data;
      } catch (error) {
        console.error('Error calculating price:', error);
        return null;
      }
    },
    enabled: !!serviceId && !!subscription?.hasSubscription && isAuthenticated,
    staleTime: 30 * 1000,
  });

  if (loading || !subscription?.hasSubscription) {
    return null;
  }

  const sub = subscription.subscription!;
  const isExpired = sub.status === 'expired';

  if (isExpired) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-sm">⏰ Ваша подписка истекла</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-purple-300 font-medium">Активная подписка</span>
          <span className="text-xs text-gray-400">
            {sub.plan.tier_name}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-400">Бесплатные визиты</div>
            <div className="text-green-400 font-medium">
              {sub.free_visits_remaining} осталось
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400">Скидка</div>
            <div className="text-blue-400 font-medium">
              {sub.plan.discount_percentage}%
            </div>
          </div>
        </div>

        {priceCalculation && (
          <div className="border-t border-purple-500/20 pt-3">
            {priceCalculation.type === 'free' && (
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">БЕСПЛАТНО!</div>
                <div className="text-xs text-gray-400">
                  Используется бесплатный визит
                </div>
              </div>
            )}
            
            {priceCalculation.type === 'discount' && (
              <div className="text-center">
                <div className="space-y-1">
                  <div className="text-gray-400 line-through text-sm">
                    {priceCalculation.originalPrice} zł
                  </div>
                  <div className="text-blue-400 font-bold text-lg">
                    {priceCalculation.price} zł
                  </div>
                  <div className="text-xs text-gray-400">
                    Скидка {priceCalculation.discountAmount} zł
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Подписка действует до {new Date(sub.expires_at!).toLocaleDateString('pl-PL')}
        </div>
      </div>
    </div>
  );
}