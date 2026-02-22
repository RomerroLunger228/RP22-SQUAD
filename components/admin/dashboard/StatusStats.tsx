/**
 * Статистика по статусам записей
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение количества записей по каждому статусу
 * - Цветовое кодирование статусов
 * - Скрытие нулевых значений для чистоты интерфейса
 * - Адаптивное отображение
 */

import React from 'react';
import { StatusStats as StatusStatsType } from '@/types/admin';
import { STATUS_STYLES, STATUS_LABELS } from '@/utils/admin/constants';

interface StatusStatsProps {
  statusStats: StatusStatsType;
  loading?: boolean;
}

/**
 * Компонент отдельной строки статуса
 * 
 * ЛОГИКА СТРОКИ:
 * - Название статуса и количество записей слева
 * - Статусный бейдж справа в едином стиле с остальными компонентами
 * - Единообразное оформление статусов по всему приложению
 * - Темный фон строки для консистентности с другими элементами
 */
interface StatusRowProps {
  status: keyof StatusStatsType;
  count: number;
  label: string;
}

const StatusRow: React.FC<StatusRowProps> = React.memo(({ status, count, label }) => {
  const styles = STATUS_STYLES[status];
  
  if (!styles) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
      {/* Название статуса и количество */}
      <div className="flex items-center gap-3">
        <span className="text-[#BBBDC0] text-sm font-montserrat">
          {label}
        </span>
        <span className="text-white font-montserrat font-semibold text-lg">
          {count}
        </span>
      </div>
      
      {/* Статус в стиле как везде в приложении */}
      <div className={`px-2 py-1 rounded-lg ${styles.background} shadow-sm`}>
        <span className={`text-xs font-montserrat font-bold ${styles.text} uppercase tracking-tight whitespace-nowrap drop-shadow-sm`} style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)' }}>
          {label}
        </span>
      </div>
    </div>
  );
});

StatusRow.displayName = 'StatusRow';

/**
 * Компонент статистики статусов
 * 
 * ЛОГИКА ОТОБРАЖЕНИЯ:
 * - Показываем только статусы с количеством больше 0
 * - Если нет данных - показываем placeholder
 * - Порядок важности: pending > canceled > no_show
 * - Загрузочные скелетоны для плавного UX
 */
const StatusStats: React.FC<StatusStatsProps> = React.memo(({ statusStats, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
        <h3 className="text-white font-montserrat font-normal text-base mb-4">
          Статистика по статусам
        </h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div 
              key={index}
              className="bg-gray-700 rounded-lg p-3 animate-pulse"
            >
              <div className="h-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Определяем какие статусы показывать (только с количеством > 0)
  const statusesToShow = [
    { key: 'pending' as const, count: statusStats.pending },
    { key: 'canceled' as const, count: statusStats.canceled },
    { key: 'no_show' as const, count: statusStats.no_show },
  ].filter(item => item.count > 0);

  return (
    <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
      <h3 className="text-white font-montserrat font-normal text-base mb-4">
        Статистика по статусам
      </h3>
      
      <div className="space-y-2">
        {statusesToShow.length === 0 ? (
          <div className="text-center py-8 text-[#BBBDC0] font-montserrat">
            Нет записей для выбранного периода
          </div>
        ) : (
          statusesToShow.map(({ key, count }) => (
            <StatusRow
              key={key}
              status={key}
              count={count}
              label={STATUS_LABELS[key]}
            />
          ))
        )}
      </div>
    </div>
  );
});

StatusStats.displayName = 'StatusStats';

export default StatusStats;