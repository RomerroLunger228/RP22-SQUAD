'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserSubscriptionResponse } from '@/types/subscription';
import { MembershipCard } from '@/components/ui/subscription/MembershipCard';
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import apiClient from '@/lib/axios';

const fetchUserSubscription = async (): Promise<UserSubscriptionResponse> => {
  const response = await apiClient.get<UserSubscriptionResponse>('/api/user/subscription');
  return response.data;
};

export default function SubscriptionCard() {
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  
  const { data: subscription, isLoading: loading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: fetchUserSubscription,
    staleTime: 5 * 60 * 1000, // 5 минут
    enabled: !!user?.id && isAuthenticated, // 🔥 ФИКС: Проверяем И user И авторизацию!
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A]"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </motion.div>
    );
  }

  if (!subscription?.hasSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A]"
      >
        
        <div className='flex flex-col items-center gap-2'>
          <h3 className="text-xl font-bold text-white my-2 font-montserrat text-center">
              Нет активной подписки
          </h3>
          <MembershipCard
            price="0"
            interval="1 month"
            type='green'
            category="Нет подписки"
            maxWidth={400}
            className="w-full"
          />
          <div>
            
            <p className="text-[#BBBDC0] text-md font-medium leading-relaxed text-center">
              Приобретите подписку для получения скидок<br/>
              и бесплатных визитов в RP22
            </p>
          </div>
            <div className='flex w-full flex-col items-center'>
              <div className="flex flex-row justify-around w-full py-2">
                <div className="text-center">
                  <div className="text-white font-bold text-lg">до 3</div>
                  <div className="text-sm text-[#BBBDC0] -mt-1">бесплатных визитов</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">до 10%</div>
                  <div className="text-sm text-[#BBBDC0] -mt-1">скидка</div>
                </div>
              </div>
              
              <button
                onClick={() => window.location.href = '/subscription'}
                className="w-full h-[44px] bg-[#FFFFFF] rounded-[12px] flex items-center justify-center mt-4"
              >
                <span className="text-[18px] font-montserrat font-bold leading-[24px] text-[#000000]">
                  Выбрать подписку
                </span>
              </button>
              
            </div> 
        </div>

      </motion.div>
    );
  }

  const sub = subscription.subscription!;
  const isExpired = sub.status === 'expired';
  const serviceName = sub.plan.service_name || (sub.plan.service_type === 'haircut' ? 'Стрижка' : 'Стрижка + борода');
  const tierType = sub.plan.tier_name.toLowerCase().includes('premium') ? 'gold' : 'purple';
  const daysLeft = sub.expires_at ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >

      <div className={`rounded-2xl pt-10 px-4 pb-4 border relative min-h-[700px] ${
        isExpired 
          ? 'bg-[#1A1A1A] border-red-500/30' 
          : tierType === 'gold'
            ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30'
            : 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30'
      }`}>
        
        {/* Premium/Plan title protruding from card */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <h2 className={`text-5xl font-bold font-cormorant-garamond italic px-6 ${
            tierType === 'gold' 
              ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] shadow-yellow-500/50' 
              : 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(126,34,206,0.5)] shadow-purple-700/50'
          }`}>
            {sub.plan.tier_name}
          </h2>
        </div>
        
        
        {/* Membership Card */}
        <div className="flex justify-center mb-4">
          <MembershipCard
            price={sub.plan.price?.toString() || '0'}
            interval={sub.plan.duration_months === 1 ? '1 month' : '3 month'}
            type={tierType}
            category={serviceName}
            maxWidth={500}
            className="w-full"
          />
        </div>

        {/* Disclaimer directly under card */}
        <div className="text-center mb-8 bg-black/10 rounded-lg p-4 mx-2">
          <p className="text-gray-300 text-sm font-medium">
            Бесплатные визиты и скидки действуют только на услугу:
          </p>
          <p className="text-white text-lg font-bold mt-1">
            {serviceName}
          </p>
        </div>

        {/* Combined minimalistic info block */}
        <div className="bg-black/20 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {sub.plan.duration_months === 1 ? '1 месяц' : '3 месяца'}
              </div>
              <div className="text-xs text-gray-400">Длительность</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-white">
                {daysLeft} дней
              </div>
              <div className="text-xs text-gray-400">до окончания</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-white">
                {sub.free_visits_used} / {sub.plan.free_visits_count}
              </div>
              <div className="text-xs text-gray-400">Бесплатные визиты</div>
            </div>
          </div>
          
          {!isExpired && (
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  tierType === 'gold'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{
                  width: `${((sub.free_visits_used) / sub.plan.free_visits_count) * 100}%`
                }}
              ></div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!isExpired && (
            <>

              {/* Статистика преимуществ */}
              <div className="w-full">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 text-center w-full">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {sub.plan.discount_percentage}%
                  </div>
                  <div className="text-sm text-blue-300">
                    скидка на остальные визиты
                  </div>
                </div>
              </div>

              {/* Дата окончания */}
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-black/20 rounded-lg">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-300 text-sm">
                    Действует до {formatDate(sub.expires_at!)}
                  </span>
                </div>
              </div>
            </>
          )}

          {isExpired && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div>
                <p className="text-red-400 text-lg font-semibold mb-2">Подписка истекла</p>
                <p className="text-gray-400 text-sm mb-4">
                  Продлите подписку, чтобы продолжить получать скидки и бесплатные визиты
                </p>
              </div>
              
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
              >
                Продлить подписку
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}