// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Компонент для расчета и отображения цен
// 
// ✅ ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ: 
// Только отображение итоговой цены с учетом скидок и подписки
//
// 🔍 ИЗВЛЕЧЕНО ИЗ: MobileConfirmation.tsx строки 188-207
// 💰 ОТВЕТСТВЕННОСТЬ: Отображение итоговой стоимости услуги

"use client";

import { BookingData } from "@/types/booking";

interface PriceCalculation {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

interface PriceSummaryProps {
  bookingData: BookingData;
  priceCalculation: PriceCalculation | undefined;
  priceLoading: boolean;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🎯 ЧИСТЫЙ КОМПОНЕНТ: Получает все данные через props
// 2. 💰 ЛОГИКА ЦЕН: Показывает оригинальную цену зачеркнутой при скидке
// 3. 🔄 СОСТОЯНИЯ ЗАГРУЗКИ: Обрабатывает loading state
// 4. 🎨 УСЛОВНЫЙ РЕНДЕРИНГ: Разная логика для разных типов цен

export function PriceSummary({ bookingData, priceCalculation, priceLoading }: PriceSummaryProps) {
  return (
    <div className="mt-6 pt-4 border-t border-[#333333]">
      <div className="flex justify-between items-center">
        <span className="text-[#BBBDC0] font-montserrat">Итого к оплате:</span>
        <div className="text-right">
          {/* 💸 ОРИГИНАЛЬНАЯ ЦЕНА (зачеркнутая при скидке) */}
          {/* ✅ ТОЧНАЯ ЛОГИКА: Показываем зачеркнутую цену только если есть скидка или бесплатно */}
          {priceCalculation && priceCalculation.type !== 'full' && (
            <div className="text-[#888888] line-through text-sm">
              {priceCalculation.originalPrice} PLN
            </div>
          )}
          
          {/* 💰 ИТОГОВАЯ ЦЕНА */}
          {/* ✅ ТОЧНАЯ ЛОГИКА: Такое же отображение как в оригинале */}
          <span className="text-white text-xl font-semibold">
            {priceLoading ? '...' : 
             priceCalculation?.type === 'free' ? 'БЕСПЛАТНО' :
             priceCalculation ? `${priceCalculation.price} PLN` :
             `${bookingData.service!.pl_price} PLN`}
          </span>
        </div>
      </div>
    </div>
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ:
// 
// 1. 🧩 ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в любом компоненте бронирования
// 2. 🎯 ФОКУС НА ОДНОЙ ЗАДАЧЕ: Только отображение цены
// 3. 🔍 УСЛОВНАЯ ЛОГИКА: Четко разделены случаи для разных типов цен
// 4. 📱 МОБИЛЬНАЯ АДАПТИВНОСТЬ: Сохранены оригинальные стили
// 5. 🚀 ПРОИЗВОДИТЕЛЬНОСТЬ: Никаких лишних вычислений