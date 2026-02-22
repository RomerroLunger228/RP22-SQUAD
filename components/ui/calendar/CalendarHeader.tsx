// components/ui/calendar/CalendarHeader.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from './utils/calendarUtils';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onToday 
}: CalendarHeaderProps) {
  const currentMonth = getMonthName(currentDate.getMonth());
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const isCurrentMonth = 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Navigation */}
      <button
        onClick={onPrevMonth}
        className="
          w-10 h-10 flex items-center justify-center
          bg-white/5 hover:bg-white/10
          text-white/80 hover:text-white
          rounded-xl transition-all duration-200
          border border-white/10 hover:border-white/20
        "
        aria-label="Предыдущий месяц"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Month/Year */}
      <div className="text-center">
        <h2 className="text-xl font-montserrat font-bold text-white">
          {currentMonth} {currentYear}
        </h2>
        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className="
              mt-1 text-sm text-white/60 hover:text-white/80
              transition-colors duration-200
            "
          >
            Сегодня
          </button>
        )}
      </div>

      {/* Navigation */}
      <button
        onClick={onNextMonth}
        className="
          w-10 h-10 flex items-center justify-center
          bg-white/5 hover:bg-white/10
          text-white/80 hover:text-white
          rounded-xl transition-all duration-200
          border border-white/10 hover:border-white/20
        "
        aria-label="Следующий месяц"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}