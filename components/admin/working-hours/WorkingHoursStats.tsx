/**
 * Компонент статистики рабочих часов
 * 
 * SOLID принципы:
 * - Single Responsibility: только отображение статистики
 * - Open/Closed: легко добавлять новые метрики
 * - Dependency Inversion: использует utils для вычислений
 */

import React from 'react';
import { WorkingDayForm } from '@/types/admin';
import { 
  calculateWeeklyHours, 
  countWorkingDays, 
  countWeekendDays, 
  calculateAverageHoursPerDay 
} from '@/utils/working-hours/calculations';

interface WorkingHoursStatsProps {
  workingDays: WorkingDayForm[];
}

const WorkingHoursStats: React.FC<WorkingHoursStatsProps> = ({ workingDays }) => {
  const weeklyHours = calculateWeeklyHours(workingDays);
  const workingDaysCount = countWorkingDays(workingDays);
  const weekendDaysCount = countWeekendDays(workingDays);
  const avgHoursPerDay = calculateAverageHoursPerDay(workingDays);

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
      <h3 className="text-lg font-montserrat font-semibold text-white mb-3">
        Сводка
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <StatCard 
          value={workingDaysCount}
          label="Рабочих дней"
          color="text-[#4F8A3E]"
        />
        
        <StatCard 
          value={weekendDaysCount}
          label="Выходных"
          color="text-[#666666]"
        />
        
        <StatCard 
          value={weeklyHours}
          label="Часов в неделю"
          color="text-[#4F8A3E]"
        />
        
        <StatCard 
          value={avgHoursPerDay}
          label="Часов в день"
          color="text-[#4F8A3E]"
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  value: number;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color }) => (
  <div>
    <p className={`text-2xl font-bold ${color}`}>
      {value}
    </p>
    <p className="text-[#BBBDC0] text-sm font-montserrat">
      {label}
    </p>
  </div>
);

export default WorkingHoursStats;