// components/ui/calendar/CalendarDay.tsx

import { CalendarDay as CalendarDayType, CalendarAppointment, BLOCKED_TIME_COLOR } from '@/types/calendar';
import { AppointmentCard } from './AppointmentCard';
import { isWorkingDay } from './utils/calendarUtils';

interface CalendarDayProps {
  day: CalendarDayType;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export function CalendarDay({ day, onAppointmentClick }: CalendarDayProps) {
  const isWorking = isWorkingDay(day);
  const hasAppointments = day.appointments.length > 0;
  const hasBlockedTimes = day.blockedTimes.length > 0;
  const maxVisibleAppointments = 1; // На мобильных показываем максимум 1 запись, остальные в "еще X"
  
  const visibleAppointments = day.appointments.slice(0, maxVisibleAppointments);
  const hiddenCount = day.appointments.length - maxVisibleAppointments;

  return (
    <div className={`
      min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-[#2A2A2A] 
      ${day.isCurrentMonth ? 'bg-[#1A1A1A]' : 'bg-[#111111]'}
      ${day.isToday ? 'ring-1 sm:ring-2 ring-[#4F8A3E] ring-opacity-50' : ''}
      hover:bg-[#1F1F1F] transition-colors
      flex flex-col
    `}>
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`
          text-xs sm:text-sm font-montserrat font-medium
          ${day.isToday 
            ? 'text-[#4F8A3E] font-bold' 
            : day.isCurrentMonth 
              ? 'text-white' 
              : 'text-[#666666]'
          }
        `}>
          {day.date.getDate()}
        </span>
        
        {/* Working Hours Indicator - только на desktop */}
        {isWorking && day.workingHours && (
          <span className="hidden sm:inline text-[10px] text-[#666666] font-mono">
            {day.workingHours.start_time}-{day.workingHours.end_time}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-1">
        {/* Non-working day indicator */}
        {!isWorking && day.isCurrentMonth && (
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] sm:text-xs text-[#666666] font-montserrat">
              Выходной
            </span>
          </div>
        )}

        {/* Working day content */}
        {isWorking && (
          <>
            {/* Blocked Times */}
            {hasBlockedTimes && day.blockedTimes.map((blockedTime) => (
              <div 
                key={blockedTime.id}
                className={`
                  w-full text-xs px-1.5 py-0.5 rounded-md
                  ${BLOCKED_TIME_COLOR} text-white
                  font-montserrat font-medium
                `}
                title={`${blockedTime.start_time}-${blockedTime.end_time}: ${blockedTime.reason}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] opacity-90 font-mono">
                    {blockedTime.start_time}-{blockedTime.end_time}
                  </span>
                  <span className="truncate">
                    {blockedTime.reason}
                  </span>
                </div>
              </div>
            ))}

            {/* Appointments */}
            {visibleAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={onAppointmentClick}
                isCompact={true}
              />
            ))}

            {/* "More" indicator */}
            {hiddenCount > 0 && (
              <div className="
                w-full text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-md
                bg-[#2A2A2A] text-[#BBBDC0] border border-[#333333]
                font-montserrat font-medium text-center
              ">
                +{hiddenCount}
              </div>
            )}

            {/* Empty state for working days */}
            {!hasAppointments && !hasBlockedTimes && (
              <div className="flex items-center justify-center h-full">
                <span className="hidden sm:inline text-xs text-[#444444] font-montserrat">
                  Свободно
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}