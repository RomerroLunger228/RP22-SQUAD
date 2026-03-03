// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Сложный компонент выбора способа оплаты
// 
// ✅ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 1. 🧩 КОМПОЗИЦИЯ: Большой компонент разбит на логические блоки  
// 2. 🔄 УСЛОВНЫЙ РЕНДЕРИНГ: Показываем разные элементы в зависимости от типа цены
// 3. 🎨 ИНТЕРАКТИВНОСТЬ: Обработка выбора способа оплаты
//
// 🔍 ИЗВЛЕЧЕНО ИЗ: MobileConfirmation.tsx строки 209-289
// 💳 ОТВЕТСТВЕННОСТЬ: Выбор и отображение способов оплаты

"use client";

import { CreditCard, Wallet, Star } from "lucide-react";

interface PriceCalculation {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

interface PaymentOptionsProps {
  selectedPayment: string;
  setSelectedPayment: (paymentId: string) => void;
  priceCalculation: PriceCalculation | undefined;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🎯 СЛОЖНЫЙ КОМПОНЕНТ: Содержит несколько подкомпонентов (список методов + информационные блоки)
// 2. 🔄 ДИНАМИЧЕСКИЕ ДАННЫЕ: Методы оплаты изменяются в зависимости от типа цены
// 3. 🎨 ИНТЕРАКТИВНОСТЬ: Обрабатывает клики и изменения состояния
// 4. 📱 RESPONSIVE: Адаптивные стили для мобильных устройств

export function PaymentOptions({ 
  selectedPayment, 
  setSelectedPayment, 
  priceCalculation 
}: PaymentOptionsProps) {
  
  // 💳 МЕТОДЫ ОПЛАТЫ - точно такие же как в оригинале (строки 94-121)
  // ✅ ВАЖНО: Сохраняем ту же логику блокировки методов
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
    <div>
      <h3 className="text-white font-medium mb-4 font-montserrat">Способ оплаты</h3>
      
      {/* 💳 СПИСОК МЕТОДОВ ОПЛАТЫ - точно такая же разметка (строки 212-255) */}
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
      
      {/* 🛍️ РЕКЛАМА ПОДПИСКИ - показываем если нет подписки (строки 257-273) */}
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
      
      {/* ✨ ИНФОРМАЦИЯ О СКИДКЕ - показываем если есть скидка (строки 275-288) */}
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
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. 🧩 КОМПОЗИЦИЯ: Компонент состоит из логических блоков (список + информация)
// 2. 🔄 УСЛОВНЫЙ РЕНДЕРИНГ: Разные блоки для разных сценариев
// 3. 🎯 ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только работа с выбором оплаты
// 4. 🎨 СОХРАНЕНИЕ СТИЛЕЙ: Точно такие же классы и анимации
// 5. 🚀 ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в других формах оплаты