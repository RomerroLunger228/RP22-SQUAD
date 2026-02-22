/**
 * Форма добавления заблокированного времени
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Форма с валидацией в реальном времени
 * - Удобные поля для даты и времени
 * - Автоматическая очистка ошибок при исправлении
 * - Состояния загрузки и отправки
 */

import React from 'react';
import { Plus, X, CalendarDays, Timer, AlertCircle } from 'lucide-react';
import { NewBlockedTimeForm, BlockedTimeValidationErrors } from '@/types/admin';
import FakeInput from '@/components/ui/FakeInput';

interface BlockedTimeFormProps {
  isVisible: boolean;
  formData: NewBlockedTimeForm;
  validationErrors: BlockedTimeValidationErrors;
  isSubmitting: boolean;
  onFormDataChange: (data: NewBlockedTimeForm | ((prev: NewBlockedTimeForm) => NewBlockedTimeForm)) => void;
  onValidationErrorsChange: (errors: BlockedTimeValidationErrors) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Компонент формы добавления заблокированного времени
 * 
 * ЛОГИКА ФОРМЫ:
 * - Отдельные поля для даты, времени начала, времени окончания
 * - Валидация в реальном времени
 * - Автоматическая очистка ошибок при исправлении полей
 * - Адаптивная верстка для мобильных устройств
 * - Отключение отправки во время загрузки
 */
const BlockedTimeForm: React.FC<BlockedTimeFormProps> = React.memo(({
  isVisible,
  formData,
  validationErrors,
  isSubmitting,
  onFormDataChange,
  onValidationErrorsChange,
  onSubmit,
  onCancel
}) => {
  if (!isVisible) return null;

  /**
   * Обновляет поле формы и очищает связанные ошибки
   */
  const updateField = (field: keyof NewBlockedTimeForm, value: string) => {
    onFormDataChange(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибки связанные с этим полем
    const errorsToRemove: (keyof BlockedTimeValidationErrors)[] = [field as keyof BlockedTimeValidationErrors];
    
    // Если обновляется время, очищаем также ошибку диапазона
    if (field === 'start_time' || field === 'end_time') {
      errorsToRemove.push('timeRange');
    }
    
    const updatedErrors = { ...validationErrors };
    errorsToRemove.forEach(errorField => {
      delete updatedErrors[errorField];
    });
    onValidationErrorsChange(updatedErrors);
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#1F1F1F] rounded-xl p-4 sm:p-6 border border-[#2A2A2A] shadow-xl">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58] flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-montserrat font-semibold text-white">
            Добавить блокировку
          </h3>
          <p className="text-[#BBBDC0] text-xs sm:text-sm font-montserrat hidden sm:block">
            Создайте недоступный для записи временной слот
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          aria-label="Закрыть форму"
        >
          <X className="w-4 h-4 text-[#BBBDC0] hover:text-white" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 sm:space-y-5">
        {/* Поле даты */}
        <div>
          <label className="flex items-center gap-2 text-sm font-montserrat text-white mb-2 font-medium">
            <CalendarDays className="w-4 h-4 text-[#4F8A3E]" />
            Дата блокировки
          </label>
          <FakeInput
            type="date"
            value={formData.date}
            onChange={(value) => updateField('date', value)}
            min={new Date().toISOString().split('T')[0]}
            error={validationErrors.date}
            placeholder="Выберите дату блокировки"
            aria-label="Дата блокировки"
            aria-describedby={validationErrors.date ? "date-error" : undefined}
          />
          {validationErrors.date && (
            <div id="date-error" className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.date}
            </div>
          )}
        </div>

        {/* Поля времени */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Время начала */}
          <div>
            <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-montserrat text-white mb-2 font-medium">
              <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-[#4F8A3E]" />
              <span className="hidden sm:inline">Время начала</span>
              <span className="sm:hidden">Начало</span>
            </label>
            <FakeInput
              type="time"
              value={formData.start_time}
              onChange={(value) => updateField('start_time', value)}
              error={validationErrors.start_time || validationErrors.timeRange}
              placeholder="Начало"
              aria-label="Время начала блокировки"
              aria-describedby={validationErrors.start_time ? "start-time-error" : undefined}
            />
            {validationErrors.start_time && (
              <div id="start-time-error" className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.start_time}
              </div>
            )}
          </div>

          {/* Время окончания */}
          <div>
            <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-montserrat text-white mb-2 font-medium">
              <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-[#4F8A3E]" />
              <span className="hidden sm:inline">Время окончания</span>
              <span className="sm:hidden">Конец</span>
            </label>
            <FakeInput
              type="time"
              value={formData.end_time}
              onChange={(value) => updateField('end_time', value)}
              error={validationErrors.end_time || validationErrors.timeRange}
              placeholder="Конец"
              aria-label="Время окончания блокировки"
              aria-describedby={validationErrors.end_time ? "end-time-error" : undefined}
            />
            {validationErrors.end_time && (
              <div id="end-time-error" className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.end_time}
              </div>
            )}
          </div>
        </div>

        {/* Ошибка диапазона времени */}
        {validationErrors.timeRange && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.timeRange}
          </div>
        )}

        {/* Поле причины */}
        <div>
          <label className="block text-sm font-montserrat text-white mb-2 font-medium">
            Причина блокировки (опционально)
          </label>
          <input
            type="text"
            placeholder="Например: Обеденный перерыв, Встреча, Перерыв"
            value={formData.reason}
            onChange={(e) => updateField('reason', e.target.value)}
            className="max-w-full w-full px-3 py-3 bg-[#2A2A2A] border border-[#333333] rounded-lg text-white font-montserrat focus:outline-none focus:border-[#4F8A3E] placeholder-[#666666] transition-colors box-border"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-[#2A2A2A] hover:bg-[#333333] text-[#BBBDC0] hover:text-white font-montserrat font-medium rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              flex-1 px-4 py-3 font-montserrat font-medium rounded-lg transition-all duration-200
              ${isSubmitting
                ? 'bg-[#333333] text-[#666666] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58] hover:from-[#5A9449] hover:to-[#76A863] text-white shadow-lg hover:shadow-xl transform hover:scale-[0.995]'
              }
            `}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить блокировку'}
          </button>
        </div>
      </form>
    </div>
  );
});

BlockedTimeForm.displayName = 'BlockedTimeForm';

export default BlockedTimeForm;