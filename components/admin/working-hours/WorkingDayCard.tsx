/**
 * Карточка настройки рабочего дня
 * 
 * SOLID принципы:
 * - Single Responsibility: только отображение и редактирование одного дня
 * - Open/Closed: легко расширяется без изменения существующего кода
 * - Dependency Inversion: использует абстракции (utils)
 */

import React from 'react';
import { WorkingDayForm, WorkingDayValidationErrors } from '@/types/admin';
import { calculateDurationText } from '@/utils/working-hours/calculations';
import { DEFAULT_WORKING_HOURS } from '@/utils/working-hours/constants';
import FakeInput from '@/components/ui/FakeInput';

interface WorkingDayCardProps {
  day: WorkingDayForm;
  dayName: string;
  errors?: WorkingDayValidationErrors;
  onChange: (updatedDay: WorkingDayForm) => void;
}

const WorkingDayCard: React.FC<WorkingDayCardProps> = ({
  day,
  dayName,
  errors,
  onChange
}) => {
  const handleWorkingToggle = () => {
    onChange({
      ...day,
      is_working: !day.is_working,
      // При включении ставим дефолтные часы, при выключении очищаем
      start_time: !day.is_working ? (day.start_time || DEFAULT_WORKING_HOURS.START) : '',
      end_time: !day.is_working ? (day.end_time || DEFAULT_WORKING_HOURS.END) : ''
    });
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    onChange({
      ...day,
      [field]: value
    });
  };

  return (
    <div className={`
      p-4 rounded-lg border transition-all duration-200
      ${day.is_working 
        ? 'bg-[#1A1A1A] border-gray-500/30 shadow-lg' 
        : 'bg-[#0F0F0F] border-[#333333] opacity-60'
      }
    `}>
      <DayHeader 
        dayName={dayName}
        isWorking={day.is_working}
        onToggle={handleWorkingToggle}
      />

      {day.is_working && (
        <div>
          <WorkingTimeInputs
            startTime={day.start_time}
            endTime={day.end_time}
            errors={errors}
            onTimeChange={handleTimeChange}
          />
          
          {/* Показываем подсказку только если значения дефолтные */}
          {(day.start_time === DEFAULT_WORKING_HOURS.START && day.end_time === DEFAULT_WORKING_HOURS.END) && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 font-montserrat">
                Установлены стандартные часы ({DEFAULT_WORKING_HOURS.START}-{DEFAULT_WORKING_HOURS.END})
              </p>
            </div>
          )}
        </div>
      )}

      {!day.is_working && <WeekendDisplay />}
    </div>
  );
};

interface DayHeaderProps {
  dayName: string;
  isWorking: boolean;
  onToggle: () => void;
}

const DayHeader: React.FC<DayHeaderProps> = ({ dayName, isWorking, onToggle }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className={`font-montserrat font-semibold text-lg ${
      isWorking ? 'text-white' : 'text-[#666666]'
    }`}>
      {dayName}
    </h3>
    
    <button
      onClick={onToggle}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${isWorking ? 'bg-gray-600' : 'bg-[#333333]'}
      `}
      aria-label={`${isWorking ? 'Отключить' : 'Включить'} работу в ${dayName}`}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isWorking ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
);

interface WorkingTimeInputsProps {
  startTime: string;
  endTime: string;
  errors?: WorkingDayValidationErrors;
  onTimeChange: (field: 'start_time' | 'end_time', value: string) => void;
}

const WorkingTimeInputs: React.FC<WorkingTimeInputsProps> = ({
  startTime,
  endTime,
  errors,
  onTimeChange
}) => (
  <div className="space-y-3">
    <TimeInput
      label="Начало работы"
      value={startTime}
      error={errors?.start_time}
      onChange={(value) => onTimeChange('start_time', value)}
    />
    
    <TimeInput
      label="Окончание работы"
      value={endTime}
      error={errors?.end_time}
      onChange={(value) => onTimeChange('end_time', value)}
    />

    {errors?.timeRange && (
      <ErrorDisplay message={errors.timeRange} />
    )}

    {startTime && endTime && startTime < endTime && (
      <DurationDisplay startTime={startTime} endTime={endTime} />
    )}
  </div>
);

interface TimeInputProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ label, value, error, onChange }) => (
  <div>
    <label className="block text-sm font-montserrat text-[#BBBDC0] mb-1">
      {label}
    </label>
    <FakeInput
      type="time"
      value={value}
      onChange={onChange}
      error={error}
      placeholder={label}
      aria-label={label}
    />
    {error && (
      <p className="text-red-400 text-xs font-montserrat mt-1">
        {error}
      </p>
    )}
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
    <p className="text-red-400 text-xs font-montserrat">
      {message}
    </p>
  </div>
);

const DurationDisplay: React.FC<{ startTime: string; endTime: string }> = ({ 
  startTime, 
  endTime 
}) => (
  <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
    <p className="text-gray-300 text-xs font-montserrat">
      Продолжительность: {calculateDurationText(startTime, endTime)}
    </p>
  </div>
);

const WeekendDisplay: React.FC = () => (
  <div className="text-center py-4">
    <p className="text-[#666666] text-sm font-montserrat">
      Выходной день
    </p>
  </div>
);

export default WorkingDayCard;