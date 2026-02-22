import { Trash2, Calendar, Loader2, X, Plus } from 'lucide-react';
import { User } from '@/types/admin';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MembershipCard } from '@/components/ui/subscription/MembershipCard';
import toast from 'react-hot-toast';
import { apiClient, createQueryKey } from '@/lib/axios';


interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => Promise<void>;
}

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

export function UserModal({ user, isOpen, onClose, onDataChange }: UserModalProps) {
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const queryClient = useQueryClient();

  // Загрузка подписки пользователя
  const { 
    data: subscriptionData, 
    isLoading: subscriptionLoading,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: createQueryKey('user-subscription', { userId: user?.id }),
    queryFn: async (): Promise<UserSubscriptionResponse> => {
      if (!user) throw new Error('User not provided');
      console.log('Fetching subscription for user:', user.id);
      const response = await apiClient.get<UserSubscriptionResponse>(`/api/user/subscription?userId=${user.id}`);
      console.log('Subscription response:', response.data);
      return response.data;
    },
    enabled: Boolean(isOpen && user),
    staleTime: 0, // Всегда получаем свежие данные
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Загрузка доступных планов подписки
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

  const subscription = subscriptionData?.hasSubscription ? subscriptionData.subscription : null;
  const availablePlans = plansData?.tiers || [];

  // Мутация для удаления подписки
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiClient.delete(`/api/admin/subscription/${subscriptionId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Подписка удалена');
      // Инвалидируем кеш подписки пользователя
      queryClient.invalidateQueries({ 
        queryKey: ['user-subscription', { userId: user?.id }]
      });
      // Инвалидируем кеш списка пользователей
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      // Принудительно обновляем данные
      refetchSubscription();
      onDataChange?.();
    },
    onError: (error: Error) => {
      console.error('Error deleting subscription:', error);
      toast.error('Ошибка при удалении подписки');
    }
  });

  // Мутация для создания подписки
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> => {
      const response = await apiClient.post<CreateSubscriptionResponse>('/api/admin/subscription/create', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Подписка добавлена');
      setShowAddSubscription(false);
      // Инвалидируем кеш подписки пользователя
      queryClient.invalidateQueries({ 
        queryKey: ['user-subscription', { userId: user?.id }]
      });
      // Инвалидируем кеш списка пользователей
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      // Принудительно обновляем данные
      refetchSubscription();
      onDataChange?.();
    },
    onError: (error: Error) => {
      console.error('Error creating subscription:', error);
      toast.error('Ошибка при добавлении подписки');
    }
  });

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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-[#0F0F0F] w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] flex-shrink-0">
          <h2 className="text-white font-montserrat font-semibold text-lg">
            Информация о пользователе
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Аватар и имя */}
          <div className="flex flex-row items-center justify-start gap-2 bg-black/60 rounded-lg p-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-2xl bg-gray-600"
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-montserrat">
                @{user.username}
              </h3>
              <p className="text-[#BBBDC0] text-sm">ID: {user.id}</p>
            </div>
          </div>

          {/* Основные данные в карточках */}
          <div className="">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center gap-1 bg-black/60 rounded-lg p-2">
                <div className="text-lg font-bold text-white ">
                  {user.points !== null && user.points !== undefined ? user.points.toLocaleString() : '0'}
                </div>
                <div className="text-xs text-gray-400 ">Поинты</div>
              </div>

              <div className="flex flex-col items-center gap-1 bg-black/60 rounded-lg p-2">
                <div className="text-lg font-bold text-white ">
                  {user.role && user.role !== 'user' ? user.role : 'USER'}
                </div>
                <div className="text-xs text-gray-400 ">Роль</div>
              </div>
            </div>
          </div>

          {/* Дата регистрации */}
          {user.created_at && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-black/20 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-300 text-sm">
                  Зарегистрирован {new Date(user.created_at).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Подписка */}
          {subscriptionLoading ? (
            <div className="bg-black/20 rounded-lg p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span className="ml-2 text-white">Загрузка подписки...</span>
            </div>
          ) : subscription ? (
            <div className={`rounded-2xl pt-6 px-4 pb-4 border relative ${
              subscription.status === 'expired' 
                ? 'bg-[#1A1A1A] border-red-500/30' 
                : subscription.plan.tier_name.toLowerCase().includes('premium')
                  ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30'
                  : 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30'
            }`}>
              {/* Premium/Plan title protruding from card */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <h2 className={`text-3xl font-bold font-cormorant-garamond italic px-4 ${
                  subscription.plan.tier_name.toLowerCase().includes('premium')
                    ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] shadow-yellow-500/50' 
                    : 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(126,34,206,0.5)] shadow-purple-700/50'
                }`}>
                  {subscription.plan.tier_name}
                </h2>
              </div>

              <div className="text-center space-y-4 mt-4">
                <div className="flex justify-center">
                  <MembershipCard
                    price={subscription.plan.price?.toString() || '0'}
                    interval={subscription.plan.duration_months === 1 ? '1 месяц' : '3 месяца'}
                    type={getSubscriptionCardType(subscription.plan.tier_name)}
                    category={subscription.plan.service_name}
                    maxWidth={350}
                    className="w-full"
                  />
                </div>

                <div className={`px-2 py-1 rounded-full text-xs font-montserrat font-medium inline-block ${
                  subscription.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : subscription.status === 'expired'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {subscription.status === 'active' ? 'АКТИВНА' : 
                   subscription.status === 'expired' ? 'ИСТЕКЛА' : subscription.status.toUpperCase()}
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {subscription.plan.discount_percentage}%
                      </div>
                      <div className="text-xs text-gray-400">Скидка</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-bold text-white">
                        {subscription.free_visits_used} / {subscription.plan.free_visits_count}
                      </div>
                      <div className="text-xs text-gray-400">Бесплатные</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-bold text-white">
                        {subscription.plan.duration_months === 1 ? '1 мес' : '3 мес'}
                      </div>
                      <div className="text-xs text-gray-400">Длительность</div>
                    </div>
                  </div>

                  {subscription.status === 'active' && (
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          subscription.plan.tier_name.toLowerCase().includes('premium')
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        }`}
                        style={{
                          width: `${((subscription.free_visits_used) / subscription.plan.free_visits_count) * 100}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                {subscription.expires_at && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-black/20 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-300 text-sm">
                        Истекает {new Date(subscription.expires_at).toLocaleDateString('pl-PL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] text-center space-y-4">
              <div>
                <h4 className="text-xl font-bold text-white mb-2 font-montserrat">
                  Нет активной подписки
                </h4>
                <MembershipCard
                  price="0"
                  interval="без подписки"
                  type="green"
                  category="Обычный пользователь"
                  maxWidth={350}
                  className="w-full"
                />
                <p className="text-[#BBBDC0] text-sm leading-relaxed mt-4">
                  Пользователь может приобрести подписку для получения скидок и бесплатных визитов
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="text-center">
                  <div className="text-white font-bold text-lg">до 3</div>
                  <div className="text-xs text-[#BBBDC0]">бесплатных визитов</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">до 10%</div>
                  <div className="text-xs text-[#BBBDC0]">скидка</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pb-24 border-t border-[#2A2A2A] flex-shrink-0 space-y-3">
          {subscription && (subscription.status === 'active' || subscription.status === 'expired') && (
            <button
              onClick={handleDeleteSubscription}
              disabled={deleteSubscriptionMutation.isPending}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {subscription.status === 'expired' ? 'Удалить истекшую подписку' : 'Удалить подписку'}
                </>
              )}
            </button>
          )}

          {(!subscription || subscription.status === 'expired') && (
            <div className="space-y-3">
              {!showAddSubscription ? (
                <button
                  onClick={handleShowAddSubscription}
                  className="w-full px-4 py-3 bg-green-500/20 text-green-300 rounded-md font-montserrat font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {subscription && subscription.status === 'expired' ? 'Продлить подписку' : 'Добавить подписку'}
                </button>
              ) : (
                <div className="fixed inset-0 bg-black z-[70] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                    <h4 className="text-white font-montserrat font-semibold text-xl">
                      {subscription && subscription.status === 'expired' ? 'Продлить подписку' : 'Выберите план подписки'}
                    </h4>
                    <button
                      onClick={() => setShowAddSubscription(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {plansLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
                        <p className="text-white text-lg">Загрузка планов...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {availablePlans.map(tier => (
                          tier.plans.map(plan => {
                            const isPremium = tier.title?.toLowerCase().includes('premium');
                            return (
                              <button
                                key={plan.id}
                                onClick={() => handleCreateSubscription(plan.id)}
                                disabled={createSubscriptionMutation.isPending}
                                className={`p-4 rounded-2xl transition-all duration-200 disabled:opacity-50 text-left relative border ${
                                  isPremium 
                                    ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30 hover:from-yellow-900/30 hover:to-amber-900/30' 
                                    : 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30 hover:from-purple-900/30 hover:to-indigo-900/30'
                                }`}
                              >
                                {/* Tier badge */}
                                <div className="absolute -top-3 left-6">
                                  <span className={`px-3 py-1 text-sm font-bold font-cormorant-garamond italic ${
                                    isPremium
                                      ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent'
                                      : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent'
                                  }`}>
                                    {tier.title}
                                  </span>
                                </div>
                                
                                <div className="mt-3">
                                  <div className="text-white font-montserrat font-bold text-xl mb-3">
                                    {plan.service?.name}
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-300 text-base">Длительность:</span>
                                      <span className="text-white font-semibold text-base">
                                        {plan.duration_months === 1 ? '1 месяц' : `${plan.duration_months} месяца`}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-300 text-base">Скидка:</span>
                                      <span className="text-green-400 font-semibold text-base">
                                        {plan.discount_percentage}%
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-300 text-base">Бесплатные визиты:</span>
                                      <span className="text-blue-400 font-semibold text-base">
                                        {plan.free_visits_count}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                                    <span className="text-gray-300 text-lg">Цена:</span>
                                    <div className="text-right">
                                      <div className="text-white font-bold text-2xl">
                                        {plan.price} PLN
                                      </div>
                                      <div className="text-gray-400 text-sm">
                                        за {plan.duration_months === 1 ? 'месяц' : `${plan.duration_months} мес.`}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {createSubscriptionMutation.isPending && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="p-6 border-t border-[#2A2A2A]">
                    <button
                      onClick={() => setShowAddSubscription(false)}
                      className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-montserrat font-medium rounded-lg transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Определяет тип карточки подписки на основе названия тарифа
 */
function getSubscriptionCardType(tierName: string): 'green' | 'gold' | 'purple' {
  const name = tierName.toLowerCase();
  
  if (name.includes('premium') || name.includes('gold') || name.includes('pro')) {
    return 'gold';
  } else if (name.includes('default') || name.includes('standard') || name.includes('basic') || name.includes('silver')) {
    return 'purple';
  } else {
    return 'purple'; // fallback для неизвестных типов - лучше purple чем green
  }
}