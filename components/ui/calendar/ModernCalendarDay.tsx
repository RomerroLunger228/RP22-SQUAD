// components/ui/calendar/ModernCalendarDay.tsx

import { CalendarDay as CalendarDayType, CalendarAppointment } from '@/types/calendar';
import { ModernAppointmentCard } from './ModernAppointmentCard';
import { isWorkingDay } from './utils/calendarUtils';

interface ModernCalendarDayProps {
  day: CalendarDayType;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export function ModernCalendarDay({ day, onAppointmentClick }: ModernCalendarDayProps) {
  const isWorking = isWorkingDay(day);
  const hasAppointments = day.appointments.length > 0;

  return (
    <div className={`
      min-h-[100px] p-3 relative
      ${day.isCurrentMonth ? 'bg-transparent' : 'bg-black/10'}
      ${day.isToday ? 'bg-[#4F8A3E]/10 border-l-2 border-l-[#4F8A3E]' : ''}
      hover:bg-white/5 transition-all duration-200
      flex flex-col
    `}>
      {/* Day Number */}
      <div className="flex items-center justify-between mb-2">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          text-sm font-montserrat font-medium
          ${day.isToday 
            ? 'bg-[#4F8A3E] text-white' 
            : day.isCurrentMonth 
              ? 'text-white' 
              : 'text-white/30'
          }
        `}>
          {day.date.getDate()}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-1">
        {/* Non-working day indicator */}
        {!isWorking && day.isCurrentMonth && (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-white/40 font-montserrat">
              Выходной
            </span>
          </div>
        )}

        {/* Working day content */}
        {isWorking && (
          <>
            {/* Blocked Times */}
            {day.blockedTimes.map((blockedTime) => (
              <div 
                key={blockedTime.id}
                className="
                  w-full text-xs px-2 py-1 rounded-lg
                  bg-red-500/20 text-red-300 border border-red-500/30
                  font-montserrat
                "
                title={`${blockedTime.start_time}-${blockedTime.end_time}: ${blockedTime.reason}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-90 font-mono">
                    {blockedTime.start_time}
                  </span>
                  <span className="truncate">
                    {blockedTime.reason}
                  </span>
                </div>
              </div>
            ))}

            {/* Appointments */}
            {day.appointments.map((appointment) => (
              <ModernAppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={onAppointmentClick}
              />
            ))}

            {/* Empty state for working days */}
            {!hasAppointments && day.blockedTimes.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}