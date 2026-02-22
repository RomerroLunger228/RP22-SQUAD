// components/ui/calendar/CalendarGrid.tsx

import { CalendarMonth, CalendarAppointment } from '@/types/calendar';
import { CalendarDay } from './CalendarDay';
import { getWeekdayNames } from './utils/calendarUtils';

interface CalendarGridProps {
  calendarMonth: CalendarMonth;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export function CalendarGrid({ calendarMonth, onAppointmentClick }: CalendarGridProps) {
  const weekdayNames = getWeekdayNames();

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-[#2A2A2A]">
        {weekdayNames.map((day) => (
          <div
            key={day}
            className="
              p-2 sm:p-4 text-center font-montserrat font-semibold text-xs sm:text-sm
              text-[#BBBDC0] bg-[#1F1F1F]
              border-r border-[#2A2A2A] last:border-r-0
            "
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarMonth.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className="border-r border-b border-[#2A2A2A] last:border-r-0"
            >
              <CalendarDay
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