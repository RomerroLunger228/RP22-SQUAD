// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Извлечение логики из MobileConfirmation
// 
// ✅ ЦЕЛЬ: Вынести ВСЮ логику, оставив UI компоненту
// 🔒 ВАЖНО: Сохраняем точно такое же поведение как в оригинале

"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useTelegramStore, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import { BookingData } from "@/types/booking";

// 📝 ТОЧНЫЕ ТИПЫ из оригинального компонента
interface PriceCalculation {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

export function useBookingConfirmation(bookingData: BookingData) {
  // 📊 ТОЧНО ТАКОЕ ЖЕ состояние как в оригинале
  const [selectedPayment, setSelectedPayment] = useState<string>("card");
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);

  // 🚀 ТОЧНО ТАКОЙ ЖЕ useQuery запрос (строки 33-51 из оригинала)
  const { data: priceCalculation, isLoading: priceLoading } = useQuery({
    queryKey: ['calculate-price', bookingData.service?.id, isAuthenticated],
    queryFn: async (): Promise<PriceCalculation> => {
      if (!bookingData.service?.id) {
        throw new Error("Услуга не выбрана");
      }

      const response = await apiClient.post('/api/calculate-price', {
        serviceId: bookingData.service.id
      });

      return response.data;
    },
    enabled: !!bookingData.service?.id && isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  // 🧠 ТОЧНО ТАКАЯ ЖЕ логика выбора способа оплаты (строки 53-64)
  const defaultPaymentMethod = useMemo(() => {
    if (priceCalculation?.type === 'free') {
      return 'subscription';
    }
    return 'card';
  }, [priceCalculation?.type]);

  useEffect(() => {
    setSelectedPayment(defaultPaymentMethod);
  }, [defaultPaymentMethod]);

  // 🛠️ ТОЧНО ТАКАЯ ЖЕ функция форматирования (строки 66-74)
  const formatDateFull = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // 🎁 ВОЗВРАЩАЕМ все что нужно компонентам
  return {
    // Состояние
    selectedPayment,
    setSelectedPayment,
    
    // API данные
    priceCalculation,
    priceLoading,
    isAuthenticated,
    
    // Утилиты
    formatDateFull,
  };
}