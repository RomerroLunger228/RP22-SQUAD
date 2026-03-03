// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Компонент для выбора временных слотов
// 
// ✅ ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Только отображение и обработка выбора временных слотов
//
// 🔍 ИЗВЛЕЧЕНО ИЗ: CalendarDatePicker.tsx строки 308-340
// ⏰ ОТВЕТСТВЕННОСТЬ: Отображение доступных временных слотов

"use client";

import { formatTimeForDisplay } from "@/lib/date-utils";

interface TimeSlotPickerProps {
  availableSlots?: string[];
  onSlotSelect: (slot: string) => void;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🎯 ЧИСТЫЙ КОМПОНЕНТ: Получает данные через props, не имеет состояния
// 2. 🧩 ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в любом календарном интерфейсе
// 3. 📱 АДАПТИВНОСТЬ: Сохранены оригинальные responsive классы
// 4. 🎨 ИНТЕРАКТИВНОСТЬ: Кнопки с hover и active эффектами

export function TimeSlotPicker({ availableSlots, onSlotSelect }: TimeSlotPickerProps) {
  return (
    <div className="bg-[#111111] rounded-[12px] p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-white font-medium font-montserrat">Доступное время</h4>
        {availableSlots && (
          <span className="text-[#7CB895] text-sm font-montserrat">
            {availableSlots.length} слотов
          </span>
        )}
      </div>

      {/* ✅ УСЛОВНЫЙ РЕНДЕРИНГ: Разные состояния для разных ситуаций */}
      {availableSlots && availableSlots.length > 0 ? (
        /* 🕐 СЕТКА ВРЕМЕННЫХ СЛОТОВ - точно такая же разметка как в оригинале */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => onSlotSelect(slot)}
              className="bg-[#7CB895] text-white rounded-[8px] py-3 px-2 hover:bg-[#6CA885] active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7CB895] focus:ring-opacity-50"
            >
              <span className="font-medium">{formatTimeForDisplay(slot)}</span>
            </button>
          ))}
        </div>
      ) : (
        /* 😕 ПУСТОЕ СОСТОЯНИЕ - точно такое же как в оригинале */
        <div className="text-center py-6">
          <div className="text-[#555555] text-4xl mb-2">😕</div>
          <p className="text-[#BBBDC0] font-montserrat">Нет доступного времени на эту дату</p>
          <p className="text-[#888888] text-sm mt-1 font-montserrat">
            Попробуйте выбрать другую дату
          </p>
        </div>
      )}
    </div>
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. 🧩 КОМПОЗИЦИЯ: Компонент легко вставляется в любую календарную систему
// 2. 🎯 ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только работа с временными слотами
// 3. 🔒 ИММУТАБЕЛЬНОСТЬ: Не изменяет переданные данные
// 4. 📝 СТРОГАЯ ТИПИЗАЦИЯ: TypeScript обеспечивает безопасность
// 5. 🎨 СОХРАНЕНИЕ UX: Точно такие же стили и анимации