// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Выделение компонента отображения услуги
// 
// ✅ ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ (SRP):
// Этот компонент отвечает ТОЛЬКО за отображение информации об услуге
// 
// 🔍 ИЗВЛЕЧЕНО ИЗ: MobileConfirmation.tsx строки 144-186
// 💡 ЦЕЛЬ: Сделать переиспользуемый компонент для отображения деталей бронирования

"use client";

import { BookingData } from "@/types/booking";
import { Calendar, Clock, Scissors } from "lucide-react";

interface ServiceSummaryProps {
  bookingData: BookingData;
  formatDateFull: (date: Date | null) => string;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ: 
// 1. 🎯 ЧИСТЫЙ КОМПОНЕНТ: Получает данные через props, не имеет собственного состояния
// 2. 🔧 ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в любом месте где нужно показать детали услуги
// 3. 📊 ПРЕЗЕНТАЦИОННЫЙ КОМПОНЕНТ: Только UI, никакой бизнес-логики

export function ServiceSummary({ bookingData, formatDateFull }: ServiceSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 💇 УСЛУГА - точно такая же разметка как в оригинале (строки 144-161) */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1 font-montserrat">Услуга</h3>
          <p className="text-[#BBBDC0]">{bookingData.service!.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-[#BBBDC0] font-montserrat">
              {bookingData.service!.duration_minutes} минут
            </span>
            <span className="text-white font-medium">
              {bookingData.service!.pl_price} PLN
            </span>
          </div>
        </div>
      </div>

      {/* 📅 ДАТА - точно такая же разметка (строки 163-172) */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-medium mb-1 font-montserrat">Дата</h3>
          <p className="text-[#BBBDC0]">{formatDateFull(bookingData.date)}</p>
        </div>
      </div>

      {/* ⏰ ВРЕМЯ - точно такая же разметка (строки 174-185) */}
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
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. 🧩 КОМПОЗИЦИЯ: Компонент можно легко вставить в любую карточку
// 2. 🎯 ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только отображение деталей услуги  
// 3. 🔒 ИММУТАБЕЛЬНОСТЬ: Не изменяет переданные данные
// 4. 📝 ТИПИЗАЦИЯ: TypeScript типы для безопасности
// 5. 💡 ЧИТАЕМОСТЬ: Понятно что делает по названию и структуре