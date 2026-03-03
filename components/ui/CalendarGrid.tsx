// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Компонент календарной сетки  
//
// ✅ ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Только отображение календаря и обработка выбора даты
//
// 🔍 ИЗВЛЕЧЕНО ИЗ: CalendarDatePicker.tsx строки 204-218
// 📅 ОТВЕТСТВЕННОСТЬ: Календарная сетка с блокировкой дат

"use client";

import { Calendar } from "@/components/ui/calendar";

interface CalendarGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  isDateDisabled: (date: Date) => boolean;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🎯 ТОНКАЯ ОБЕРТКА: Простой интерфейс над сложным Calendar компонентом
// 2. 🔒 ДЕЛЕГИРОВАНИЕ: Логика блокировки дат делегируется родительскому хуку
// 3. 📱 КОНФИГУРАЦИЯ: Сохранены все оригинальные настройки календаря
// 4. 🎨 СТИЛИЗАЦИЯ: Точно такие же классы и стили

export function CalendarGrid({ 
  selectedDate, 
  onDateSelect, 
  isDateDisabled 
}: CalendarGridProps) {
  return (
    <div className="bg-[#111111] rounded-xl">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={isDateDisabled}
        weekStartsOn={1}
        className="w-full"
        classNames={{
          day: "custom-day-class",
          day_selected: "custom-selected-class",
        }}
      />
    </div>
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
//
// 1. 🧩 КОМПОЗИЦИЯ: Оборачивает сложный Calendar в простой интерфейс
// 2. 🎯 ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только работа с календарной сеткой  
// 3. 🔄 ПРОКСИРОВАНИЕ: Передает функции без изменения логики
// 4. 📝 ТИПИЗАЦИЯ: Четкий интерфейс для props
// 5. 🎨 ИНКАПСУЛЯЦИЯ: Скрывает сложность настройки Calendar