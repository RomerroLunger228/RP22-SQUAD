/**
 * Статистика по категориям услуг
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение статистики по каждой категории
 * - Фильтрация по временным периодам
 * - Показ количества записей и дохода
 * - Цветовое разделение категорий
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CategoryStats as CategoryStatsType, FilterPeriodType } from '@/types/admin';
import { CATEGORY_GRADIENTS, TIME_FILTER_OPTIONS } from '@/utils/admin/constants';
import { formatCurrency } from '@/utils/admin/formatting';

interface CategoryStatsProps {
  categoryStats: CategoryStatsType[];
  timePeriodFilter: FilterPeriodType;
  onPeriodFilterChange: (period: FilterPeriodType) => void;
  loading?: boolean;
}

/**
 * Компонент карточки категории
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Градиентный фон для визуального разделения
 * - Иконка TrendingUp как универсальный индикатор бизнеса
 * - Количество записей как основная метрика
 * - Доход как дополнительная информация
 * - Циклическое использование цветов
 */
interface CategoryCardProps {
  category: CategoryStatsType;
  gradientIndex: number;
}

const CategoryCard: React.FC<CategoryCardProps> = React.memo(({ category, gradientIndex }) => {
  const gradient = CATEGORY_GRADIENTS[gradientIndex % CATEGORY_GRADIENTS.length];

  return (
    <div className={`
      bg-gradient-to-br ${gradient.background} border rounded-xl p-3
      transition-transform duration-200 hover:scale-105
    `}>
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <TrendingUp className={`w-4 h-4 ${gradient.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`${gradient.text} text-xs font-medium truncate`}>
            {category.name}
          </p>
        </div>
      </div>
      
      {/* Основная метрика */}
      <div className="text-2xl font-outfit font-bold text-white mb-1">
        {category.count}
      </div>
      
      {/* Дополнительная информация */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-white/60">записей</p>
        <p className="text-white/80 font-medium">
          {formatCurrency(category.revenue)}
        </p>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

/**
 * Компонент статистики категорий
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Фильтр по периодам в заголовке
 * - Сетка карточек категорий
 * - Обработка пустого состояния
 * - Загрузочные состояния
 */
const CategoryStats: React.FC<CategoryStatsProps> = React.memo(({
  categoryStats,
  timePeriodFilter,
  onPeriodFilterChange,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h3 className="text-white font-montserrat font-normal text-base">
            Статистика по категориям
          </h3>
          <div className="flex gap-1 bg-[#2A2A2A] rounded-lg p-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="py-1 px-2 bg-gray-600 rounded-md animate-pulse"
              >
                <div className="w-12 h-4 bg-gray-500 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-700 rounded-xl p-3 animate-pulse"
            >
              <div className="h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
      {/* Заголовок и фильтр периодов */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <h3 className="text-white font-montserrat font-normal text-base">
          Статистика по категориям
        </h3>
        
        {/* Фильтр периодов */}
        <div className="flex gap-1 bg-[#2A2A2A] rounded-lg p-[2px]">
          {TIME_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodFilterChange(option.value)}
              className={`
                py-1 px-2 text-xs font-outfit rounded-md transition-all duration-200 whitespace-nowrap
                ${
                  timePeriodFilter === option.value
                    ? 'bg-white text-black font-medium'
                    : 'text-[#BBBDC0] hover:text-white'
                }
              `}
              aria-pressed={timePeriodFilter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Карточки категорий */}
      <div className="space-y-3">
        {categoryStats.length === 0 ? (
          <div className="text-center py-8 text-[#BBBDC0] font-montserrat">
            Нет данных о категориях
          </div>
        ) : (
          categoryStats.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              gradientIndex={index}
            />
          ))
        )}
      </div>
    </div>
  );
});

CategoryStats.displayName = 'CategoryStats';

export default CategoryStats;