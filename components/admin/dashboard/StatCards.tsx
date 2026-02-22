/**
 * Карточки статистики для дашборда
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение ключевых метрик
 * - Процентные изменения с цветовым кодированием
 * - Адаптивная сетка карточек
 * - Анимации для привлекательности
 */

import React from 'react';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { AdminStats, TabType } from '@/types/admin';
import { formatPercentChange } from '@/utils/admin/formatting';

interface StatCardsProps {
  stats: AdminStats;
  loading?: boolean;
  onTabChange?: (tab: TabType) => void;
}

/**
 * Индивидуальная карточка статистики
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Иконка для визуальной идентификации
 * - Главная метрика (крупным шрифтом)
 * - Процентное изменение (с цветом)
 * - Градиентный фон для привлекательности
 */
interface StatCardProps {
  title: string;
  subtitle: string;
  value: number;
  percentChange: number;
  icon: React.ReactNode;
  gradientColors: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  subtitle,
  value,
  percentChange,
  icon,
  gradientColors,
  onClick
}) => {
  const { text: percentText, colorClass: percentColor } = formatPercentChange(percentChange);

  return (
    <div 
      className={`
        bg-gradient-to-br ${gradientColors} rounded-[18px] p-3 relative overflow-hidden
        transform transition-transform duration-200 hover:scale-105
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Заголовок и иконка */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-outfit text-sm font-normal">
            {title}
          </h3>
          <p className="text-white/50 font-outfit text-xs font-normal">
            {subtitle}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <div className="text-white [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </div>
        </div>
      </div>

      {/* Основная метрика и изменение */}
      <div className="flex items-end justify-between">
        <div className="text-2xl font-outfit font-bold text-white">
          {value.toLocaleString()}
        </div>
        <div className={`text-white/80 text-sm font-outfit font-medium ${percentColor}`}>
          {percentText}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Компонент карточек статистики
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Сетка 2x2 для компактности на мобильных
 * - Скелетон загрузки для лучшего UX
 * - Мемоизация для производительности
 * - Разные цвета для визуального разделения
 */
const StatCards: React.FC<StatCardsProps> = React.memo(({ stats, loading = false, onTabChange }) => {

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-[18px] p-3 animate-pulse"
          >
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Карточка записей */}
      <StatCard
        title="Записи"
        subtitle="этот месяц"
        value={stats.appointmentsThisMonth}
        percentChange={stats.appointmentsPercentChange}
        icon={<Calendar />}
        gradientColors="from-gray-500/20 to-gray-600/20"
        onClick={() => onTabChange?.('appointments')}
      />

      {/* Карточка пользователей */}
      <StatCard
        title="Пользователи"
        subtitle="всего"
        value={stats.totalUsers}
        percentChange={stats.usersPercentChange}
        icon={<Users />}
        gradientColors="from-gray-500/20 to-gray-600/20"
        onClick={() => onTabChange?.('users')}
      />

      {/* Карточка дохода */}
      <StatCard
        title="Доход"
        subtitle="этот месяц"
        value={stats.monthlyRevenue}
        percentChange={0} // Доход не имеет процентного изменения в данной версии
        icon={<TrendingUp />}
        gradientColors="from-gray-500/20 to-gray-600/20"
        onClick={() => onTabChange?.('finance')}
      />

      {/* Карточка ожидающих записей */}
      <StatCard
        title="Ожидают"
        subtitle="подтверждения"
        value={stats.pendingThisMonth}
        percentChange={0} // Статусы не имеют процентного изменения
        icon={<Calendar />}
        gradientColors="from-gray-500/20 to-gray-600/20"
        onClick={() => onTabChange?.('working-hours')}
      />
    </div>
  );
});

StatCards.displayName = 'StatCards';

export default StatCards;