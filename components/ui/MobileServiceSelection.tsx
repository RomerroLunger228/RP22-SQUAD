// components/mobile/MobileServiceSelection.tsx
"use client";

import { Service } from "@/types/booking";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, createQueryKey } from "@/lib/axios";
import { CATEGORY_GRADIENTS } from "@/utils/admin/constants";

interface SubscriptionInfo {
  hasSubscription: boolean;
  serviceId: number | null;
  tier: 'default' | 'premium' | null;
}

interface MobileServiceSelectionProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  isLoading?: boolean;
  userId?: number;
}

/**
 * Получает стили категории на основе category_id
 * category_id 1 = золотой, 2 = зеленый, 3 = фиолетовый
 */
function getCategoryStyle(categoryId: number | undefined, isSelected: boolean) {
  if (!categoryId) return null;
  
  // Используем (categoryId - 1) для индексации с 0
  const categoryIndex = (categoryId - 1) % CATEGORY_GRADIENTS.length;
  const gradient = CATEGORY_GRADIENTS[categoryIndex];
  
  if (isSelected) {
    // Для выбранной карточки используем градиенты как в админке
    switch (categoryIndex) {
      case 0: // Золотой
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-400";
      case 1: // Зеленый  
        return "bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400";
      case 2: // Фиолетовый
        return "bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400";
      default:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-400";
    }
  } else {
    // Для обычной карточки используем стили из констант с фоном и обводкой
    // Разбиваем gradient.background на части
    const [fromColor, toColor, borderColor] = gradient.background.split(' ');
    return `bg-gradient-to-r ${fromColor} ${toColor} border ${borderColor} ${gradient.text}`;
  }
}

export function MobileServiceSelection({
  services,
  selectedService,
  onSelect,
  isLoading = false,
  userId,
}: MobileServiceSelectionProps) {
  // Получаем информацию о подписке с помощью React Query
  const { data: subscriptionInfo = {
    hasSubscription: false,
    serviceId: null,
    tier: null
  } } = useQuery({
    queryKey: createQueryKey('user-subscription-services', { userId }),
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!userId) {
        throw new Error("User ID не предоставлен");
      }

      const response = await apiClient.get('/api/user/subscription/services', {
        headers: {
          'x-user-id': userId.toString()
        }
      });

      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 минут - подписка редко изменяется
    retry: 2,
  });

  const getServiceCardStyle = (service: Service) => {
    const baseClasses = "w-full text-left p-4 rounded-xl transition-all duration-200 border";
    
    // Если выбрана
    if (selectedService?.id === service.id) {
      return `${baseClasses} bg-white border-white`;
    }
    
    // Если есть льгота на эту конкретную услугу
    if (subscriptionInfo.hasSubscription && subscriptionInfo.serviceId === service.id) {
      if (subscriptionInfo.tier === 'premium') {
        return `${baseClasses} bg-gradient-to-br from-amber-900/40 to-yellow-900/30 border-amber-500/50 hover:border-amber-500`;
      } else {
        return `${baseClasses} bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border-purple-500/50 hover:border-purple-500`;
      }
    }
    
    // Обычная услуга
    return `${baseClasses} bg-[#111111] border-[#222222] hover:border-[#333333]`;
  };
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-[#BBBDC0] font-montserrat">Загрузка услуг...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-semibold text-white mb-2">Выберите услугу</h1>
        <p className="text-[#BBBDC0] text-sm font-montserrat">
          Выберите услугу для записи к мастеру
        </p>
      </div>

      
        <div className="space-y-3">
        {services
          .sort((a, b) => {
            // Сортировка по category_id: 1, 2, 3, затем остальные
            const aId = a.category_id || 999;
            const bId = b.category_id || 999;
            return aId - bId;
          })
          .map((service) => (
            <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={getServiceCardStyle(service)}
            >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                <h3 className={`font-montserrat font-medium ${
                    selectedService?.id === service.id ? "text-black" : "text-white"
                }`}>
                    {service.name}
                </h3>
                {/* ИСПРАВЛЕНО: показываем просто "мин" без числа */}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-sm font-montserrat ${
                      selectedService?.id === service.id ? "text-[#444444]" : "text-[#888888]"
                  }`}>
                      {service.duration_minutes} мин
                  </p>
                  {service.category_name && (
                    <span className={`px-2 py-1 text-xs rounded-md font-montserrat ${
                      getCategoryStyle(service.category_id, selectedService?.id === service.id) || 
                      (selectedService?.id === service.id ? "bg-blue-200/30 text-blue-600" : "bg-blue-500/20 text-blue-300")
                    }`}>
                      {service.category_name}
                    </span>
                  )}
                </div>
                </div>
                <div className={`text-lg font-semibold ${
                selectedService?.id === service.id ? "text-black" : "text-white"
                }`}>
                {service.pl_price} PLN
                </div>
            </div>
            
            {selectedService?.id === service.id && (
                <div className="mt-3 pt-3 border-t border-[#333333]">
                <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-black font-montserrat font-medium">Выбрано</span>
                </div>
                </div>
            )}
            </button>
        ))}
        </div>

      {selectedService && (
        <div className="mt-8">
          <button
            onClick={() => {/* Переход на следующий шаг через пропс */}}
            className="w-full py-4 bg-white text-black font-montserrat font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200"
          >
            Продолжить с выбранной услугой
          </button>
        </div>
      )}
    </div>
  );
}