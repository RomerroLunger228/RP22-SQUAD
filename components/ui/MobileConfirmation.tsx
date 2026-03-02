// components/mobile/MobileConfirmation.tsx
"use client";

import { BookingData } from "@/types/booking";
import { ChevronLeft, Calendar, Clock, Scissors, CreditCard, Wallet, Star } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useTelegramStore, selectIsAuthenticated } from '@/lib/stores/telegramStore';

interface MobileConfirmationProps {
  bookingData: BookingData;
  onConfirm: (paymentMethod: string) => void;
  onBack: () => void;
}

interface PriceCalculation {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

export function MobileConfirmation({
  bookingData,
  onConfirm,
  onBack
}: MobileConfirmationProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>("card");
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);

  // 🔥 ПРАВИЛЬНОЕ РЕШЕНИЕ: useQuery с автоматическим кэшированием
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
    enabled: !!bookingData.service?.id && isAuthenticated, // Запрос только когда есть данные
    staleTime: 30 * 1000, // Кэш на 30 секунд - предотвращает спам запросы
    gcTime: 5 * 60 * 1000, // Держим в памяти 5 минут
    retry: 1, // Только 1 повтор при ошибке
    retryDelay: 1000, // Задержка перед повтором
  });

  // 🎯 Правильный автовыбор способа оплаты через useMemo (избегаем setState в useEffect)
  const defaultPaymentMethod = useMemo(() => {
    if (priceCalculation?.type === 'free') {
      return 'subscription';
    }
    return 'card';
  }, [priceCalculation?.type]);

  // Обновляем selectedPayment только при изменении defaultPaymentMethod
  useEffect(() => {
    setSelectedPayment(defaultPaymentMethod);
  }, [defaultPaymentMethod]);

  const formatDateFull = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!bookingData.service || !bookingData.date || !bookingData.timeSlot) {
    return (
      <div className="px-4 py-3">
        <div className="text-center py-12">
          <div className="text-[#555555] text-4xl mb-4">❌</div>
          <p className="text-white text-lg mb-2 font-montserrat">Неполные данные</p>
          <p className="text-[#BBBDC0] font-montserrat">Пожалуйста, заполните все поля</p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-3 bg-white text-black font-medium rounded-xl"
          >
            <span className="font-montserrat">Вернуться назад</span>
          </button>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    {
      id: "card",
      name: "Карта онлайн",
      description: "Оплата банковской картой",
      icon: CreditCard,
      color: "#635BFF",
      disabled: priceCalculation?.type === 'free' // Блокируем если бесплатный визит
    },
    {
      id: "cash",
      name: "Наличными",
      description: "Оплата на месте",
      icon: Wallet,
      color: "#10B981",
      disabled: priceCalculation?.type === 'free' // Блокируем если бесплатный визит
    },
    {
      id: "subscription",
      name: "Подписка",
      description: priceCalculation?.type === 'free' 
        ? "Бесплатный визит по подписке" 
        : "Только для бесплатных визитов",
      icon: Star,
      color: "#F59E0B",
      disabled: priceCalculation?.type !== 'free' // Доступна только для бесплатных визитов
    },
  ];

  return (
    <div className="px-4 py-3">
      {/* Хедер */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white font-montserrat">Подтверждение записи</h1>
            <p className="text-[#BBBDC0] text-sm font-montserrat">Проверьте данные перед подтверждением</p>
          </div>
        </div>
      </div>

      {/* Карточка с информацией */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6">
        <div className="space-y-4">
          {/* Услуга */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1 font-montserrat">Услуга</h3>
              <p className="text-[#BBBDC0]">{bookingData.service.name}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-[#BBBDC0] font-montserrat">
                  {bookingData.service.duration_minutes} минут
                </span>
                <span className="text-white font-medium">
                  {bookingData.service.pl_price} PLN
                </span>
              </div>
            </div>
          </div>

          {/* Дата */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1 font-montserrat">Дата</h3>
              <p className="text-[#BBBDC0]">{formatDateFull(bookingData.date)}</p>
            </div>
          </div>

          {/* Время */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1 font-montserrat">Время</h3>
              <p className="text-[#BBBDC0]">
                {bookingData.formattedTime || bookingData.timeSlot?.substring(0, 5)}
              </p>
            </div>
          </div>
        </div>

        {/* Итого */}
        <div className="mt-6 pt-4 border-t border-[#333333]">
          <div className="flex justify-between items-center">
            <span className="text-[#BBBDC0] font-montserrat">Итого к оплате:</span>
            <div className="text-right">
              {priceCalculation && priceCalculation.type !== 'full' && (
                <div className="text-[#888888] line-through text-sm">
                  {priceCalculation.originalPrice} PLN
                </div>
              )}
              <span className="text-white text-xl font-semibold">
                {priceLoading ? '...' : 
                 priceCalculation?.type === 'free' ? 'БЕСПЛАТНО' :
                 priceCalculation ? `${priceCalculation.price} PLN` :
                 `${bookingData.service.pl_price} PLN`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор способа оплаты */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6">
        <h3 className="text-white font-medium mb-4 font-montserrat">Способ оплаты</h3>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => !method.disabled && setSelectedPayment(method.id)}
                disabled={method.disabled}
                className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  method.disabled ? "opacity-50 cursor-not-allowed" :
                  selectedPayment === method.id
                    ? "bg-[#2A2A2A] border border-[#333333]"
                    : "bg-transparent hover:bg-[#222222]"
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${method.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: method.color }} />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      selectedPayment === method.id ? "text-white" : "text-[#BBBDC0]"
                    }`}>
                      {method.name}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPayment === method.id 
                        ? "border-[#635BFF] bg-[#635BFF]" 
                        : "border-[#444444]"
                    }`}>
                      {selectedPayment === method.id && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#888888] mt-1">{method.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Кнопка покупки подписки - показываем только если нет подписки */}
        {priceCalculation?.type === 'full' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Получи скидку с подпиской!</p>
                <p className="text-gray-400 text-sm">Бесплатные визиты и постоянная скидка</p>
              </div>
              <button 
                onClick={() => window.location.href = '/subscription'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Купить
              </button>
            </div>
          </div>
        )}
        
        {/* Информация о применяемой скидке */}
        {priceCalculation?.type === 'discount' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Скидка по подписке применена</p>
                <p className="text-gray-400 text-sm">
                  Экономия {priceCalculation.discountAmount} PLN ({Math.round((priceCalculation.discountAmount! / priceCalculation.originalPrice!) * 100)}%)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="space-y-3">
        <button
          onClick={() => onConfirm(selectedPayment)}
          className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200"
        >
          <span className="font-montserrat">
            {selectedPayment === "subscription" 
              ? priceCalculation?.type === 'free' 
                ? "Забронировать бесплатно" 
                : "Забронировать со скидкой"
              : selectedPayment === "cash" 
              ? "Забронировать" 
              : "Перейти к оплате"}
          </span>
        </button>
        
        
        <button
          onClick={onBack}
          className="w-full py-4 bg-transparent border border-[#333333] text-white font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors"
        >
          <span className="font-montserrat">Изменить время</span>
        </button>
      </div>

      {/* Информационное сообщение */}
      <div className="mt-6 p-4 bg-[#2A2A2A] rounded-xl">
        <p className="text-[#BBBDC0] text-sm text-center font-montserrat">
          {selectedPayment === "subscription" 
            ? priceCalculation?.type === 'free'
              ? "Запись будет забронирована бесплатно с использованием подписки"
              : "Запись будет забронирована со скидкой по подписке"
            : selectedPayment === "cash" 
            ? "Оплата производится на месте после оказания услуги"
            : "После подтверждения вы будете перенаправлены на безопасную страницу оплаты"
          }
        </p>
      </div>
    </div>
  );
}