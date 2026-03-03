// 🎯 ОБУЧАЮЩИЙ ПРИМЕР: Календарный контейнер (Container Pattern)
// 
// ✅ АРХИТЕКТУРНЫЙ ПАТТЕРН "КОНТЕЙНЕР":
// 1. 🧠 ЛОГИКА: Содержит всю логику через useCalendarLogic хук
// 2. 🧩 КОМПОЗИЦИЯ: Собирает маленькие компоненты в единое целое
// 3. 🔄 ОРКЕСТРАЦИЯ: Координирует взаимодействие между компонентами
//
// 🔄 РЕЗУЛЬТАТ РЕФАКТОРИНГА:
// 363 строки → 5 компонентов + 1 хук = Читаемый и поддерживаемый код

"use client";

import { dateToUTCString } from "@/lib/date-utils";
import { useCalendarLogic } from "@/hooks/useCalendarLogic";
import { CalendarGrid } from "./CalendarGrid";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { AvailabilityIndicator } from "./AvailabilityIndicator";

interface CalendarContainerProps {
  serviceId: number;
  onSlotSelect?: (slot: string) => void;
}

// 📝 ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. 🎯 КОНТЕЙНЕР: Управляет данными и состоянием через хук
// 2. 🧩 КОМПОЗИЦИЯ: Собирает маленькие специализированные компоненты
// 3. 🔄 ДЕЛЕГИРОВАНИЕ: Передает данные и обработчики дочерним компонентам
// 4. 📱 СОСТОЯНИЯ: Обрабатывает loading, error и success состояния

export function CalendarContainer({ serviceId, onSlotSelect }: CalendarContainerProps) {
  // 🧠 ВСЯ ЛОГИКА В ХУКЕ - контейнер остается чистым
  const {
    selectedDate,
    bookingData,
    isLoading,
    error,
    handleDateSelect,
    isDateDisabled,
    selectedDateStr,
  } = useCalendarLogic(serviceId);

  // 🎯 ОБРАБОТЧИК ВЫБОРА СЛОТА - точно такой же как в оригинале
  const handleSlotSelect = (slot: string) => {
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  return (
    <div className="bg-[#000000] rounded-[16px] p-4 md:p-6 space-y-6">
      {/* 📋 ЗАГОЛОВОК - точно такой же как в оригинале (строки 194-202) */}
      <div>
        <h3 className="text-[20px] md:text-[22px] font-medium text-white mb-2">
          <span className="font-montserrat">Выберите дату записи</span>
        </h3>
        <p className="text-[#BBBDC0] text-sm font-montserrat">
          {selectedDate && `Выбрано: ${dateToUTCString(selectedDate)}`}
        </p>
      </div>

      {/* 📅 КАЛЕНДАРНАЯ СЕТКА - выделен в отдельный компонент */}
      <CalendarGrid
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        isDateDisabled={isDateDisabled}
      />

      {/* 🔄 СОСТОЯНИЕ ЗАГРУЗКИ - точно такое же (строки 221-228) */}
      {isLoading && (
        <div className="bg-[#111111] rounded-[12px] p-6 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#7CB895] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#BBBDC0] font-montserrat">Ищем доступное время...</span>
          </div>
        </div>
      )}

      {/* ❌ СОСТОЯНИЕ ОШИБКИ - точно такое же (строки 231-241) */}
      {error && !isLoading && (
        <div className="bg-[#331111] border border-red-500/30 rounded-[12px] p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-lg">⚠️</div>
            <div>
              <h4 className="text-red-300 font-medium mb-1 font-montserrat">Не удалось загрузить данные</h4>
              <p className="text-red-200/80 text-sm">{error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ УСПЕШНОЕ СОСТОЯНИЕ - когда данные загружены */}
      {bookingData && !isLoading && !error && (
        <div className="space-y-4">
          {/* 📊 ИНДИКАТОР ДОСТУПНОСТИ - выделен в отдельный компонент */}
          <AvailabilityIndicator
            serviceInfo={bookingData.meta?.service}
            workingHours={bookingData.workingHours}
            appointments={bookingData.appointments}
          />

          {/* ⏰ ВЫБОР ВРЕМЕННЫХ СЛОТОВ - выделен в отдельный компонент */}
          <TimeSlotPicker
            availableSlots={bookingData.availableSlots}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      )}
    </div>
  );
}

// 📚 ОБУЧАЮЩИЕ ИТОГИ РЕФАКТОРИНГА:
// 
// 🎯 ЧТО ДОСТИГНУТО:
// ✅ 363 строки разбиты на 4 переиспользуемых компонента + 1 хук
// ✅ Каждый компонент имеет единственную ответственность
// ✅ Логика отделена от представления
// ✅ Компоненты можно переиспользовать в других календарях
// ✅ Код стал читаемым и поддерживаемым
// ✅ Легко тестировать каждый компонент отдельно
//
// 🚫 ЧТО НЕ СЛОМАЛОСЬ:
// ✅ Точно такой же UI и UX
// ✅ Все состояния обрабатываются корректно
// ✅ API компонента не изменился
// ✅ Производительность осталась той же
//
// 🚀 ПРИНЦИПЫ SOLID ПРИМЕНЕНЫ:
// 📍 S - Single Responsibility: Каждый компонент решает одну задачу
// 📍 O - Open/Closed: Компоненты можно расширять через props
// 📍 L - Liskov Substitution: Компоненты взаимозаменяемы
// 📍 I - Interface Segregation: Минимальные интерфейсы props
// 📍 D - Dependency Inversion: Зависимости инжектируются через props