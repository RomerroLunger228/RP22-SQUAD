// components/ui/calendar/WeekNavigator.tsx

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
}

interface WeekNavigatorProps {
  weekDays: WeekDay[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddAppointment?: () => void;
}

export function WeekNavigator({
  weekDays,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddAppointment
}: WeekNavigatorProps) {
  const today = new Date();
  const isCurrentWeek = weekDays.some(day => 
    day.date.toDateString() === today.toDateString()
  );

  const currentMonth = selectedDate.toLocaleDateString('ru-RU', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className=" backdrop-blur-sm p-3 mb-0 ">
      {/* Days of week - simplified */}
      <div className="flex items-center justify-between gap-1">
        {/* Prev Week Button */}
        <button
          onClick={onPrevWeek}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Days */}
        <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {weekDays.map((day, index) => (
            <button
              key={index}
              onClick={() => onSelectDate(day.date)}
              className={`
                flex-shrink-0 flex flex-col items-center p-2 rounded-lg
                transition-all duration-200 min-w-[48px]
                ${day.isSelected
                  ? 'bg-white text-black'
                  : day.isToday
                    ? 'bg-white/20 text-white'
                    : 'text-[#BBBDC0] hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="text-xs font-medium">
                {day.dayName}
              </span>
              <span className="text-sm font-bold">
                {day.dayNumber}
              </span>
            </button>
          ))}
        </div>

        {/* Next Week Button */}
        <button
          onClick={onNextWeek}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Следующая неделя"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month indicator and actions - simplified */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#BBBDC0] capitalize font-montserrat">
            {currentMonth}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="text-xs text-[#888888] hover:text-[#BBBDC0] transition-colors font-montserrat"
            >
              Сегодня
            </button>
          )}
        </div>
        
        {/* Add appointment button for admin */}
        {onAddAppointment && (
          <button
            onClick={onAddAppointment}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-white/90 text-black text-xs font-medium font-montserrat rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Добавить запись
          </button>
        )}
      </div>
    </div>
  );
}