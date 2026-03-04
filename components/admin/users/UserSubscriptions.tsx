// ОБУЧАЮЩИЙ ПРИМЕР: Сложный компонент управления подписками
// 
// ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Этот компонент отвечает ТОЛЬКО за отображение состояния подписок пользователя
// 
// ИЗВЛЕЧЕНО ИЗ: UserModal.tsx строки 254-387
// ОТВЕТСТВЕННОСТЬ: Отображение активной подписки, отсутствие подписки, состояния загрузки

"use client";

import { Calendar, Loader2 } from 'lucide-react';
import { MembershipCard } from '@/components/ui/subscription/MembershipCard';

// ТИПЫ ПОДПИСКИ - точно такие же как в оригинале
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

interface UserSubscriptionsProps {
  subscription: Subscription | null;
  isLoading: boolean;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. СЛОЖНЫЙ КОМПОНЕНТ: Содержит логику отображения для разных состояний
// 2. УСЛОВНЫЙ РЕНДЕРИНГ: Разные блоки для загрузки, активной подписки, отсутствия
// 3. ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в других админских интерфейсах
// 4. СОХРАНЕНИЕ UX: Точно такие же стили, анимации и градиенты

export function UserSubscriptions({ subscription, isLoading }: UserSubscriptionsProps) {
  // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ - точно такая же как в оригинале (строки 547-557)
  const getSubscriptionCardType = (tierName: string): 'green' | 'gold' | 'purple' => {
    const name = tierName.toLowerCase();
    
    if (name.includes('premium') || name.includes('gold') || name.includes('pro')) {
      return 'gold';
    } else if (name.includes('default') || name.includes('standard') || name.includes('basic') || name.includes('silver')) {
      return 'purple';
    } else {
      return 'purple';
    }
  };

  // СОСТОЯНИЕ ЗАГРУЗКИ - точно такое же (строки 254-258)
  if (isLoading) {
    return (
      <div className="bg-black/20 rounded-lg p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
        <span className="ml-2 text-white">Загрузка подписки...</span>
      </div>
    );
  }

  // АКТИВНАЯ ПОДПИСКА - точно такая же разметка (строки 259-356)
  if (subscription) {
    return (
      <div className={`rounded-2xl pt-6 px-4 pb-4 border relative ${
        subscription.status === 'expired' 
          ? 'bg-[#1A1A1A] border-red-500/30' 
          : subscription.plan.tier_name.toLowerCase().includes('premium')
            ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30'
            : 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30'
      }`}>
        {/* Premium/Plan title protruding from card - точная копия (строки 268-276) */}
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
          {/* MEMBERSHIP CARD - точно такая же (строки 279-288) */}
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

          {/* СТАТУС ПОДПИСКИ - точно такой же (строки 290-299) */}
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

          {/* СТАТИСТИКА ПОДПИСКИ - точно такая же (строки 301-339) */}
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

            {/* ПРОГРЕСС-БАР - точно такой же (строки 325-338) */}
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

          {/* ДАТА ИСТЕЧЕНИЯ - точно такая же (строки 341-354) */}
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
    );
  }

  // ОТСУТСТВИЕ ПОДПИСКИ - точно такая же разметка (строки 357-387)
  return (
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
      
      {/* СТАТИСТИКА ДЛЯ ОБЫЧНОГО ПОЛЬЗОВАТЕЛЯ - точно такая же (строки 376-385) */}
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
  );
}

// ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. УСЛОВНЫЙ РЕНДЕРИНГ: Три разных состояния (загрузка, есть подписка, нет подписки)
// 2. СЛОЖНАЯ UI ЛОГИКА: Градиенты, анимации, прогресс-бары сохранены
// 3. ПЕРЕИСПОЛЬЗУЕМОСТЬ: Компонент можно использовать в других админских интерфейсах
// 4. СОХРАНЕНИЕ UX: Точно такие же стили, цвета и эффекты
// 5. ИНКАПСУЛЯЦИЯ: Вспомогательная функция getSubscriptionCardType внутри компонента