/**
 * Фильтр времени для финансовой вкладки
 * Стилизован в стиле Send/Request/Bank из макета
 */

import React from 'react';

export type FinanceTimePeriod = 'day' | 'week' | 'month';

interface FinanceTimeFilterProps {
  selectedPeriod: FinanceTimePeriod;
  onPeriodChange: (period: FinanceTimePeriod) => void;
}

const PERIOD_OPTIONS = [
  { value: 'day' as const, label: 'День', icon: '📅' },
  { value: 'week' as const, label: 'Неделя', icon: '📊' },
  { value: 'month' as const, label: 'Месяц', icon: '🏛️' }
];

const FinanceTimeFilter: React.FC<FinanceTimeFilterProps> = React.memo(({ 
  selectedPeriod, 
  onPeriodChange 
}) => {
  return (
    <div className="w-full bg-[#2A2A2A] rounded-xl p-1">
      <div className="grid grid-cols-3 gap-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg
              font-montserrat font-medium text-sm transition-all duration-200
              ${selectedPeriod === option.value
                ? 'bg-[#D4AF37] text-[#111213] shadow-lg scale-105'
                : 'bg-transparent text-[#BBBDC0] hover:bg-[#3A3A3A] hover:text-white'
              }
            `}
            aria-pressed={selectedPeriod === option.value}
            aria-label={`Фильтр по ${option.label.toLowerCase()}`}
          >
            <div className="text-lg mb-1">{option.icon}</div>
            <span className="text-xs">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

FinanceTimeFilter.displayName = 'FinanceTimeFilter';

export default FinanceTimeFilter;