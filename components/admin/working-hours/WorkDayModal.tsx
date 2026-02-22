/**
 * Модалка для настройки рабочего дня
 * 
 * UX ЛОГИКА:
 * - Показывает дату
 * - Переключатель "Рабочий день" ON/OFF
 * - Если ON: показывает поля времени start/end
 * - Если OFF: день полностью выходной
 * - Кнопки Save/Cancel
 */

"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { formatDateForAPI } from '@/lib/date-utils';
import FakeInput from '@/components/ui/FakeInput';

interface WorkDay {
  id?: number;
  date: string;
  is_working: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

interface WorkDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialData?: WorkDay;
  onSave: (workDay: WorkDay) => Promise<void>;
}

export const WorkDayModal: React.FC<WorkDayModalProps> = ({
  isOpen,
  onClose,
  date,
  initialData,
  onSave
}) => {
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateString = formatDateForAPI(date);
  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Инициализация данных
  useEffect(() => {
    if (initialData) {
      setIsWorking(initialData.is_working);
      setStartTime(initialData.start_time || '10:00');
      setEndTime(initialData.end_time || '18:00');
    } else {
      // Дефолтные значения для нового дня
      setIsWorking(false);
      setStartTime('10:00');
      setEndTime('18:00');
    }
    setError(null);
  }, [initialData, isOpen]);

  // Закрытие модалки
  const handleClose = () => {
    if (isSaving) return;
    setError(null);
    onClose();
  };

  // Валидация времени
  const validateTime = (start: string, end: string): string | null => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(start)) {
      return 'Неверный формат времени начала работы';
    }
    
    if (!timeRegex.test(end)) {
      return 'Неверный формат времени окончания работы';
    }

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Поддержка работы через полночь
    let duration = endMinutes - startMinutes;
    if (duration <= 0) {
      duration = (24 * 60) + duration;
    }
    
    if (duration < 30) {
      return 'Минимальная продолжительность работы - 30 минут';
    }
    
    if (duration > 16 * 60) {
      return 'Максимальная продолжительность работы - 16 часов';
    }

    return null;
  };

  // Сохранение
  const handleSave = async () => {
    setError(null);
    
    // Валидация для рабочих дней
    if (isWorking) {
      const validationError = validateTime(startTime, endTime);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);

    try {
      const workDay: WorkDay = {
        ...(initialData?.id && { id: initialData.id }),
        date: dateString,
        is_working: isWorking,
        start_time: isWorking ? startTime : null,
        end_time: isWorking ? endTime : null
      };

      await onSave(workDay);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-montserrat font-semibold text-white">
              Настройка дня
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date Display */}
          <div className="text-center bg-white/5 rounded-xl p-4">
            <p className="text-sm text-white/60 mb-1 font-montserrat">Дата</p>
            <p className="text-white font-montserrat font-semibold capitalize">
              {formattedDate}
            </p>
          </div>

          {/* Working Day Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <label className="text-white font-montserrat font-medium">
                Рабочий день
              </label>
              <button
                onClick={() => setIsWorking(!isWorking)}
                disabled={isSaving}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50
                  ${isWorking ? 'bg-white' : 'bg-white/20'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full transition-transform
                    ${isWorking ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'}
                  `}
                />
              </button>
            </div>

            {/* Time Fields */}
            {isWorking && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2 font-montserrat">
                      Начало работы
                    </label>
                    <FakeInput
                      type="time"
                      value={startTime}
                      onChange={(value) => setStartTime(value)}
                      disabled={isSaving}
                      aria-label="Начало работы"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2 font-montserrat">
                      Окончание работы
                    </label>
                    <FakeInput
                      type="time"
                      value={endTime}
                      onChange={(value) => setEndTime(value)}
                      disabled={isSaving}
                      aria-label="Окончание работы"
                    />
                  </div>
                </div>

                {/* Duration Display */}
                {(() => {
                  const [startHour, startMinute] = startTime.split(':').map(Number);
                  const [endHour, endMinute] = endTime.split(':').map(Number);
                  const startMinutes = startHour * 60 + startMinute;
                  const endMinutes = endHour * 60 + endMinute;
                  let duration = endMinutes - startMinutes;
                  
                  if (duration <= 0) {
                    duration = (24 * 60) + duration;
                  }
                  
                  const hours = Math.floor(duration / 60);
                  const minutes = duration % 60;
                  
                  return (
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-white/70 text-center font-montserrat">
                        Продолжительность: {hours}ч {minutes > 0 ? `${minutes}м` : ''}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-2 h-2 text-white" />
                </div>
                <p className="text-red-400 text-sm font-montserrat font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-montserrat font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black font-montserrat font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};