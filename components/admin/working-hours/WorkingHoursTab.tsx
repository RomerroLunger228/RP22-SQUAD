/**
 * Основной компонент управления рабочими часами
 * 
 * SOLID принципы:
 * - Single Responsibility: только композиция дочерних компонентов
 * - Open/Closed: новая функциональность добавляется через новые компоненты
 * - Interface Segregation: каждый компонент получает только нужные props
 * - Dependency Inversion: использует хуки для логики
 */

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { useWorkingHours } from '@/hooks/admin/useWorkingHours';
import { WorkingDayForm, WorkingDayValidationErrors } from '@/types/admin';
import { WEEKDAY_NAMES, WEEKDAY_ORDER } from '@/utils/working-hours/constants';
import WorkingDayCard from './WorkingDayCard';

interface WorkingHoursTabProps {
  loading?: boolean;
}

const WorkingHoursTab: React.FC<WorkingHoursTabProps> = ({ loading = false }) => {
  const {
    workingDays,
    validationErrors,
    isLoading,
    isSaving,
    saveMessage,
    updateDay,
    reload
  } = useWorkingHours();

  if (isLoading || loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <Header onReload={reload} isSaving={isSaving} isLoading={isLoading} />
      
      {saveMessage && <NotificationMessage message={saveMessage} />}
      
      <WorkingDaysGrid 
        workingDays={workingDays}
        validationErrors={validationErrors}
        onDayChange={updateDay}
      />
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F8A3E] mx-auto mb-4"></div>
      <p className="text-[#BBBDC0] font-montserrat">Загрузка настроек рабочих часов...</p>
    </div>
  </div>
);

interface HeaderProps {
  onReload: () => void;
  isSaving: boolean;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReload, isSaving, isLoading }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3">
      <Clock className="w-6 h-6 text-gray-400" />
      <div>
        <h2 className="text-xl font-montserrat font-semibold text-white">
          Рабочие часы
        </h2>
        <p className="text-[#BBBDC0] text-sm font-montserrat">
          {isSaving ? 'Сохранение изменений...' : 'Настройки сохраняются автоматически'}
        </p>
      </div>
    </div>

    <div className="flex gap-2">
      <ActionButton
        onClick={onReload}
        disabled={isLoading}
        variant="secondary"
        icon={RefreshCw}
        loading={isLoading}
      >
        Обновить
      </ActionButton>
    </div>
  </div>
);

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary';
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  variant,
  icon: Icon,
  loading,
  children
}) => {
  const baseClasses = "flex items-center gap-2 px-4 py-2 font-montserrat transition-all";
  const variantClasses = {
    primary: "bg-gray-600 hover:bg-gray-500 text-white",
    secondary: "bg-[#2A2A2A] hover:bg-[#333333] text-[#BBBDC0] hover:text-white border border-[#333333]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        rounded-lg
        disabled:opacity-50
      `}
    >
      <Icon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {children}
    </button>
  );
};

const NotificationMessage: React.FC<{ message: { type: 'success' | 'error', text: string } }> = ({ message }) => (
  <div className={`
    p-4 rounded-lg border font-montserrat
    ${message.type === 'success' 
      ? 'bg-gray-500/10 border-gray-500/30 text-gray-300' 
      : 'bg-red-500/10 border-red-500/30 text-red-400'
    }
  `}>
    {message.text}
  </div>
);

interface WorkingDaysGridProps {
  workingDays: WorkingDayForm[];
  validationErrors: Record<number, WorkingDayValidationErrors>;
  onDayChange: (day: WorkingDayForm) => void;
}

const WorkingDaysGrid: React.FC<WorkingDaysGridProps> = ({ 
  workingDays, 
  validationErrors, 
  onDayChange 
}) => {
  // Сортируем дни по правильному порядку (Пн-Вс)
  const sortedDays = WEEKDAY_ORDER.map(weekday => 
    workingDays.find(day => day.weekday === weekday)
  ).filter((day): day is WorkingDayForm => day !== undefined);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedDays.map((day) => (
        <WorkingDayCard
          key={day.weekday}
          day={day}
          dayName={WEEKDAY_NAMES[day.weekday as keyof typeof WEEKDAY_NAMES]}
          errors={validationErrors[day.weekday]}
          onChange={onDayChange}
        />
      ))}
    </div>
  );
};

export default WorkingHoursTab;