// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Компонент индикации доступности
// 
// ✅ ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Только отображение информации о сервисе, рабочем времени и занятых слотах
//
// 🔍 ИЗВЛЕЧЕНО ИЗ: CalendarDatePicker.tsx строки 244-306
// 📊 ОТВЕТСТВЕННОСТЬ: Показ метаинформации о бронировании

"use client";

import { formatTimeForDisplay } from "@/lib/date-utils";

// 📝 ТИПЫ - точно такие же как в оригинале
interface ServiceInfo {
  id: number;
  name: string;
  duration_minutes: number;
}

interface WorkingHours {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
}

interface Appointment {
  id: number;
  user_id: number;
  appointment_date: string;
  time: string;
  service_id: number;
  duration_minutes: number;
  created_at: string;
}

interface AvailabilityIndicatorProps {
  serviceInfo?: ServiceInfo;
  workingHours?: WorkingHours;
  appointments?: Appointment[];
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🧩 КОМПОЗИЦИЯ: Состоит из 3 независимых информационных блоков
// 2. 🎯 ПРЕЗЕНТАЦИОННЫЙ КОМПОНЕНТ: Только отображение, никакой логики
// 3. 📱 RESPONSIVE: Адаптивные grid классы сохранены
// 4. 🎨 КОНСИСТЕНТНОСТЬ: Точно такие же стили как в оригинале

export function AvailabilityIndicator({ 
  serviceInfo, 
  workingHours, 
  appointments 
}: AvailabilityIndicatorProps) {
  return (
    <div className="space-y-4">
      {/* 🛍️ ИНФОРМАЦИЯ ОБ УСЛУГЕ - точно такая же разметка (строки 247-262) */}
      {serviceInfo && (
        <div className="bg-[#111111] rounded-[12px] p-4">
          <h4 className="text-white font-medium mb-2 font-montserrat">Выбранная услуга</h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white text-sm">{serviceInfo.name}</p>
              <p className="text-[#BBBDC0] text-xs font-montserrat">
                Длительность: {serviceInfo.duration_minutes} мин
              </p>
            </div>
            <div className="text-[#7CB895] text-sm font-medium">
              ID: {serviceInfo.id}
            </div>
          </div>
        </div>
      )}

      {/* ⏰ РАБОЧЕЕ ВРЕМЯ - точно такая же разметка (строки 265-284) */}
      {workingHours && (
        <div className="bg-[#111111] rounded-[12px] p-4">
          <h4 className="text-white font-medium mb-2 font-montserrat">Рабочее время</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-white">
                {formatTimeForDisplay(workingHours.start_time)}
              </span>
            </div>
            <span className="text-[#BBBDC0]">—</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-white">
                {formatTimeForDisplay(workingHours.end_time)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🚫 ЗАНЯТЫЕ СЛОТЫ - точно такая же разметка (строки 287-305) */}
      {appointments && appointments.length > 0 && (
        <div className="bg-[#111111] rounded-[12px] p-4">
          <h4 className="text-white font-medium mb-3 font-montserrat">Занятое время</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="bg-[#222222] rounded-[8px] p-3"
              >
                <div className="text-white text-sm font-medium mb-1">
                  {formatTimeForDisplay(appointment.time)}
                </div>
                <div className="text-[#BBBDC0] text-xs font-montserrat">
                  {appointment.duration_minutes} мин
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 📚 ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. 🧩 МОДУЛЬНОСТЬ: Каждый блок информации можно показать/скрыть независимо
// 2. 🎯 ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только отображение метаинформации
// 3. 📝 СТРОГАЯ ТИПИЗАЦИЯ: Четкие интерфейсы для каждого типа данных
// 4. 🔄 УСЛОВНЫЙ РЕНДЕРИНГ: Блоки показываются только при наличии данных
// 5. 🎨 UX КОНСИСТЕНТНОСТЬ: Сохранены все оригинальные стили и иконки