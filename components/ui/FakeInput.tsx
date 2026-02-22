/**
 * Fake Input компонент для Telegram мини-приложений
 * 
 * Решает проблемы с нативными date/time инпутами в Telegram WebApp:
 * - Контролируемая ширина без overflow
 * - Consistent стилизация
 * - Лучшая совместимость с Telegram
 */

import React, { useRef, useCallback } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface FakeInputProps {
  type: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const FakeInput: React.FC<FakeInputProps> = ({
  type,
  value,
  onChange,
  
  error,
  disabled = false,
  className = '',
  min,
  max,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  /**
   * Получает иконку для типа инпута
   */
  const getIcon = useCallback(() => {
    const iconClass = "w-4 h-4 text-[#BBBDC0] flex-shrink-0";
    
    switch (type) {
      case 'date':
        return <Calendar className={iconClass} />;
      case 'time':
        return <Clock className={iconClass} />;
      default:
        return null;
    }
  }, [type]);


  return (
    <div className="relative">
      {/* Стилизованный нативный input */}
      <input
        ref={hiddenInputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={ariaLabel || `${type === 'date' ? 'Выбор даты' : 'Выбор времени'}`}
        aria-describedby={ariaDescribedBy}
        className={`
          w-full px-3 py-2 bg-[#2A2A2A] border rounded-lg font-montserrat text-white
          transition-colors duration-200 appearance-none
          [color-scheme:dark]
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:border-[#444444]'
          }
          ${error 
            ? 'border-red-500 focus:border-red-400' 
            : 'border-[#333333] hover:border-[#4F8A3E] focus:border-[#4F8A3E]'
          }
          ${className}
        `}
        style={{
          colorScheme: 'dark',
        }}
      />

      {/* Overlay с иконками поверх input */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none pr-3">
        <div className="flex items-center">
          {error && <AlertCircle className="w-4 h-4 text-red-500 mr-1" />}
          {getIcon()}
        </div>
      </div>
    </div>
  );
};

export default FakeInput;