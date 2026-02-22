// components/ui/calendar/ModernCalendarGrid.tsx

import { CalendarMonth, CalendarAppointment } from '@/types/calendar';
import { ModernCalendarDay } from './ModernCalendarDay';
import { getWeekdayNames } from './utils/calendarUtils';

interface ModernCalendarGridProps {
  calendarMonth: CalendarMonth;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export function ModernCalendarGrid({ calendarMonth, onAppointmentClick }: ModernCalendarGridProps) {
  const weekdayNames = getWeekdayNames();

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekdayNames.map((day) => (
          <div
            key={day}
            className="
              p-4 text-center font-montserrat font-medium text-sm
              text-white/60 bg-white/5
            "
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {calendarMonth.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className="border-r border-b border-white/5 last:border-r-0"
            >
              <ModernCalendarDay
                day={day}
                onAppointmentClick={onAppointmentClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}