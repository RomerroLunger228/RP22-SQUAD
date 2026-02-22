/**
 * Список заблокированного времени
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение всех заблокированных временных слотов
 * - Фильтрация по дате
 * - Возможность удаления блокировок
 * - Адаптивная верстка для мобильных устройств
 */

import React, { useMemo } from 'react';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { BlockedTime } from '@/types/admin';
import { formatDate, formatTime } from '@/utils/admin/formatting';

interface BlockedTimesListProps {
  blockedTimes: BlockedTime[];
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  onDeleteBlockedTime: (id: number) => void;
  loading?: boolean;
}

/**
 * Компонент карточки заблокированного времени
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Адаптивная верстка (мобильная и десктопная версии)
 * - Информация о дате, времени и причине
 * - Кнопка удаления с подтверждением
 * - Цветовое кодирование (красный для блокировок)
 */
interface BlockedTimeCardProps {
  blockedTime: BlockedTime;
  onDelete: (id: number) => void;
}

const BlockedTimeCard: React.FC<BlockedTimeCardProps> = React.memo(({ 
  blockedTime, 
  onDelete 
}) => {
  return (
    <div className="group bg-gradient-to-br from-[#1A1A1A] to-[#1F1F1F] rounded-xl p-4 sm:p-5 border border-[#2A2A2A] hover:border-red-500/30 transition-all duration-200 hover:shadow-lg">
      {/* Мобильная версия */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-montserrat font-semibold text-base">
                {blockedTime.date ? formatDate(blockedTime.date) : 'Без даты'}
              </div>
              <div className="text-[#BBBDC0] text-sm font-montserrat truncate">
                {blockedTime.reason || 'Без указания причины'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(blockedTime.id)}
            className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 rounded-lg transition-all duration-200 hover:shadow-lg flex-shrink-0 ml-2"
            aria-label="Удалить блокировку"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center">
          <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
            <span className="text-red-300 font-montserrat text-sm font-medium">
              {blockedTime.start_time?.substring(0, 5)} - {blockedTime.end_time?.substring(0, 5)}
            </span>
          </div>
        </div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-white font-montserrat font-semibold text-lg">
                {blockedTime.date ? formatDate(blockedTime.date) : 'Без даты'}
              </span>
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-red-300 font-montserrat text-sm font-medium">
                  {blockedTime.start_time?.substring(0, 5)} - {blockedTime.end_time?.substring(0, 5)}
                </span>
              </div>
            </div>
            <p className="text-[#BBBDC0] font-montserrat">
              {blockedTime.reason || 'Без указания причины'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onDelete(blockedTime.id)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 font-montserrat font-medium rounded-lg transition-all duration-200 hover:shadow-lg opacity-70 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
      </div>
    </div>
  );
});

BlockedTimeCard.displayName = 'BlockedTimeCard';

/**
 * Основной компонент списка заблокированного времени
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Фильтр по дате с выпадающим списком
 * - Сортировка по дате и времени
 * - Пустое состояние с призывом к действию
 * - Загрузочные состояния
 */
const BlockedTimesList: React.FC<BlockedTimesListProps> = React.memo(({
  blockedTimes,
  dateFilter,
  onDateFilterChange,
  onDeleteBlockedTime,
  loading = false
}) => {
  // Фильтрация и сортировка заблокированного времени
  const filteredBlockedTimes = useMemo(() => {
    let filtered = blockedTimes;
    
    // Фильтрация по дате
    if (dateFilter) {
      filtered = filtered.filter(bt => bt.date === dateFilter);
    }
    
    // Сортировка: сначала по дате, потом по времени начала
    return filtered.sort((a, b) => {
      if (a.date && b.date) {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
      }
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }
      return 0;
    });
  }, [blockedTimes, dateFilter]);

  // Получаем уникальные даты для фильтра
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(
      blockedTimes.map(bt => bt.date).filter(Boolean)
    )).sort();
    
    return dates.map(date => ({
      value: date!,
      label: formatDate(date!)
    }));
  }, [blockedTimes]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Заголовок загрузки */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-48 h-6 bg-gray-700 animate-pulse rounded"></div>
          <div className="w-32 h-10 bg-gray-700 animate-pulse rounded"></div>
        </div>
        
        {/* Статистика загрузки */}
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="w-32 h-4 bg-gray-600 rounded"></div>
              <div className="w-24 h-3 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Загрузочные карточки */}
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] animate-pulse">
              <div className="h-16 sm:h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-montserrat font-semibold text-base sm:text-lg">
              {blockedTimes.length} блокировок
            </div>
            <div className="text-red-300 text-xs sm:text-sm font-montserrat">
              Активных в системе
            </div>
          </div>
        </div>
      </div>

      {/* Фильтр по дате */}
      {blockedTimes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-sm font-montserrat text-white font-medium">
            <Calendar className="w-4 h-4 text-[#4F8A3E]" />
            Фильтр по дате:
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="px-3 py-2 bg-[#2A2A2A] border border-[#333333] rounded-lg text-white font-montserrat text-sm focus:outline-none focus:border-[#4F8A3E] w-full sm:w-auto"
            >
              <option value="">Все даты</option>
              {availableDates.map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
            {dateFilter && (
              <span className="text-[#BBBDC0] text-xs sm:text-sm font-montserrat">
                Показано: {filteredBlockedTimes.length} из {blockedTimes.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Список заблокированного времени */}
      {blockedTimes.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-[#1A1A1A]/50 to-[#1F1F1F]/50 rounded-xl border border-[#2A2A2A] border-dashed">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white font-montserrat font-semibold text-lg mb-2">
            Нет заблокированных времен
          </h3>
          <p className="text-[#BBBDC0] font-montserrat mb-6">
            Создайте первую блокировку времени для управления расписанием
          </p>
        </div>
      ) : filteredBlockedTimes.length === 0 ? (
        <div className="text-center py-8 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
          <p className="text-[#BBBDC0] font-montserrat">
            Нет блокировок для выбранной даты
          </p>
          <button
            onClick={() => onDateFilterChange('')}
            className="mt-3 px-4 py-2 bg-[#4F8A3E] hover:bg-[#5A9449] text-white font-montserrat font-medium rounded-lg transition-colors"
          >
            Показать все
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBlockedTimes.map((blockedTime) => (
            <BlockedTimeCard
              key={blockedTime.id}
              blockedTime={blockedTime}
              onDelete={onDeleteBlockedTime}
            />
          ))}
        </div>
      )}
    </div>
  );
});

BlockedTimesList.displayName = 'BlockedTimesList';

export default BlockedTimesList;