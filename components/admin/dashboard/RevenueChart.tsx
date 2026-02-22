/**
 * График доходов для дашборда
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Интерактивный график с данными о доходах
 * - Переключение периодов (7 дней / 30 дней / 3 месяца)
 * - Кастомизированный дизайн графика
 * - Адаптивность под разные экраны
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { ChartPeriodType, RevenueChartData } from '@/types/admin';
import { CHART_PERIOD_OPTIONS } from '@/utils/admin/constants';

interface RevenueChartProps {
  data: RevenueChartData[];
  selectedPeriod: ChartPeriodType;
  onPeriodChange: (period: ChartPeriodType) => void;
  loading?: boolean;
}

/**
 * Компонент графика доходов
 * 
 * ЛОГИКА ВИЗУАЛИЗАЦИИ:
 * - Area chart для показа трендов доходов
 * - Градиент заливки для привлекательности
 * - Кастомный тултип с дополнительной информацией
 * - Адаптивные оси и подписи
 * - Анимации для плавности
 */
const RevenueChart: React.FC<RevenueChartProps> = React.memo(({
  data,
  selectedPeriod,
  onPeriodChange,
  loading = false
}) => {
  /**
   * Кастомный компонент тултипа
   * 
   * ЛОГИКА ТУЛТИПА:
   * - Показывает точное значение дохода
   * - Отображает полную дату периода
   * - Стилизация в соответствии с темой
   */
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: RevenueChartData;
      value: number;
    }>;
    label?: string;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 shadow-xl">
          <p className="text-[#8B5CF6] font-medium text-sm mb-1">
            {data.fullDate || label}
          </p>
          <p className="text-white font-semibold">
            {payload[0].value} PLN
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-montserrat font-normal text-base">Revenue</h3>
          <div className="flex gap-1 bg-[#2A2A2A] rounded-lg p-1">
            {CHART_PERIOD_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="py-1 px-2 text-xs rounded-md bg-gray-600 animate-pulse"
              >
                <div className="w-16 h-4 bg-gray-500 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-64 bg-gray-700 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-[20px] p-4 border border-[#2A2A2A]">
      {/* Заголовок и кнопки периодов */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-montserrat font-normal text-base">
          Доходы
        </h3>
        
        {/* Кнопки переключения периода */}
        <div className="flex gap-1 bg-[#2A2A2A] rounded-lg p-[2px]">
          {CHART_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`
                py-1 px-2 text-xs font-outfit rounded-md transition-all duration-200 whitespace-nowrap
                ${
                  selectedPeriod === option.value
                    ? 'bg-white text-black font-medium'
                    : 'text-[#BBBDC0] hover:text-white'
                }
              `}
              aria-pressed={selectedPeriod === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* График */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#BBBDC0] font-montserrat">
              Нет данных для отображения
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              {/* Определение градиента */}
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              {/* Сетка */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#333333" 
                vertical={false}
              />
              
              {/* Ось X */}
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#8B8B8B', 
                  fontSize: 11, 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 400
                }}
              />
              
              {/* Ось Y */}
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#8B8B8B', 
                  fontSize: 10, 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 400
                }}
                tickFormatter={(value) => `${value}`}
                width={50}
              />
              
              {/* Тултип */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* График области */}
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={{ 
                  fill: '#FFFFFF', 
                  stroke: '#8B5CF6', 
                  strokeWidth: 2, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  fill: '#8B5CF6', 
                  stroke: '#FFFFFF', 
                  strokeWidth: 2 
                }}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart;