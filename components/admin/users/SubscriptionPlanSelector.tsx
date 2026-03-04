// ОБУЧАЮЩИЙ ПРИМЕР: Полноэкранная модалка выбора планов подписки
// 
// ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Этот компонент отвечает ТОЛЬКО за выбор плана подписки из списка доступных
// 
// ИЗВЛЕЧЕНО ИЗ: UserModal.tsx строки 423-534
// ОТВЕТСТВЕННОСТЬ: Отображение списка планов, обработка выбора, состояния загрузки

"use client";

import { Loader2, X } from 'lucide-react';

// ТИПЫ ПЛАНОВ - точно такие же как в оригинале
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

interface SubscriptionPlanSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlans: SubscriptionTier[];
  isLoading: boolean;
  onSelectPlan: (planId: number) => void;
  isCreating: boolean;
  hasExpiredSubscription?: boolean;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. ПОЛНОЭКРАННАЯ МОДАЛКА: Перекрывает весь экран для фокуса на выборе
// 2. ИНТЕРАКТИВНЫЙ КОМПОНЕНТ: Обрабатывает клики и передает данные наверх
// 3. СОСТОЯНИЕ ЗАГРУЗКИ: Показывает разные состояния (загрузка списка, создание подписки)
// 4. СЛОЖНАЯ ВЕРСТКА: Сетка планов с градиентами и анимациями

export function SubscriptionPlanSelector({ 
  isOpen, 
  onClose, 
  availablePlans, 
  isLoading, 
  onSelectPlan, 
  isCreating,
  hasExpiredSubscription = false
}: SubscriptionPlanSelectorProps) {
  // Если модалка закрыта, ничего не рендерим
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[70] flex flex-col">
      {/* HEADER - точно такой же как в оригинале (строки 425-435) */}
      <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
        <h4 className="text-white font-montserrat font-semibold text-xl">
          {hasExpiredSubscription ? 'Продлить подписку' : 'Выберите план подписки'}
        </h4>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* CONTENT - точно такой же контент (строки 437-523) */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* СОСТОЯНИЕ ЗАГРУЗКИ - точно такое же (строки 439-443) */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-lg">Загрузка планов...</p>
          </div>
        ) : (
          /* СЕТКА ПЛАНОВ - точно такая же разметка (строки 445-521) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {availablePlans.map(tier => (
              tier.plans.map(plan => {
                const isPremium = tier.title?.toLowerCase().includes('premium');
                return (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan.id)}
                    disabled={isCreating}
                    className={`p-4 rounded-2xl transition-all duration-200 disabled:opacity-50 text-left relative border ${
                      isPremium 
                        ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30 hover:from-yellow-900/30 hover:to-amber-900/30' 
                        : 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30 hover:from-purple-900/30 hover:to-indigo-900/30'
                    }`}
                  >
                    {/* TIER BADGE - точно такой же (строки 461-469) */}
                    <div className="absolute -top-3 left-6">
                      <span className={`px-3 py-1 text-sm font-bold font-cormorant-garamond italic ${
                        isPremium
                          ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent'
                      }`}>
                        {tier.title}
                      </span>
                    </div>
                    
                    {/* ДЕТАЛИ ПЛАНА - точно такие же (строки 471-509) */}
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
                      
                      {/* ЦЕНА ПЛАНА - точно такая же (строки 499-509) */}
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
                      
                      {/* OVERLAY ЗАГРУЗКИ - точно такой же (строки 511-515) */}
                      {isCreating && (
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
      
      {/* FOOTER - точно такой же (строки 525-533) */}
      <div className="p-6 border-t border-[#2A2A2A]">
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-montserrat font-medium rounded-lg transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

// ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. ПОЛНОЭКРАННАЯ МОДАЛКА: z-[70] выше основной модалки для правильного наслоения
// 2. УСЛОВНЫЙ РЕНДЕРИНГ: Разные состояния загрузки и отображения планов
// 3. ИНТЕРАКТИВНОСТЬ: Обработка кликов и передача данных через колбеки
// 4. СЛОЖНАЯ ВЕРСТКА: Градиенты, анимации и hover эффекты сохранены
// 5. ACCESSIBILITY: disabled состояние во время создания подписки
// 6. ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в любом месте где нужен выбор плана