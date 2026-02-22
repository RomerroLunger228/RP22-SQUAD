// components/ui/calendar/AppointmentCard.tsx

import { CalendarAppointment, APPOINTMENT_COLORS } from '@/types/calendar';
import { formatAppointmentTime } from './utils/calendarUtils';
import { formatAppointmentPrice } from '@/utils/price-utils';

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  onClick: (appointment: CalendarAppointment) => void;
  isCompact?: boolean;
}

export function AppointmentCard({ appointment, onClick, isCompact = false }: AppointmentCardProps) {
  const colorClasses = APPOINTMENT_COLORS[appointment.status];
  const time = formatAppointmentTime(appointment);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(appointment);
  };

  if (isCompact) {
    // Компактный вид для календарной сетки
    return (
      <div
        onClick={handleClick}
        className={`
          w-full text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-md cursor-pointer
          transition-all duration-200 hover:shadow-md hover:scale-105
          ${colorClasses} text-white
          font-montserrat font-medium
          truncate
        `}
        title={`${time} - ${appointment.service.name}`}
      >
        <div className="flex items-center gap-1">
          <span className="text-[8px] sm:text-[10px] opacity-90 font-mono flex-shrink-0">
            {time}
          </span>
          <span className="truncate text-[9px] sm:text-[10px]">
            {appointment.service.name}
          </span>
        </div>
      </div>
    );
  }

  // Полный вид для списка
  return (
    <div
      onClick={handleClick}
      className={`
        w-full p-3 rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
        ${colorClasses} text-white
        border border-white/10
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-montserrat font-semibold text-sm">
          {appointment.service.name}
        </span>
        <span className="font-mono text-xs opacity-90">
          {time}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs opacity-90">
        <span>
          {appointment.service.duration_minutes} мин
        </span>
        <span>
          {(() => {
            const priceInfo = formatAppointmentPrice(appointment);
            return (
              <div className="flex flex-col text-right">
                <span className="text-xs">{priceInfo.displayText}</span>
                {priceInfo.originalPrice && (
                  <span className="text-[10px] opacity-60 line-through">{priceInfo.originalPrice} PLN</span>
                )}
              </div>
            );
          })()}
        </span>
      </div>
      
      <div className="mt-2 flex justify-end">
        <div className={`
          inline-block px-2 py-1 rounded-md text-xs font-medium
          ${getStatusStyle(appointment.status)}
        `}>
          {getStatusText(appointment.status)}
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: CalendarAppointment['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-200';
    case 'confirmed':
      return 'bg-green-500/20 text-green-200';
    case 'completed':
      return 'bg-slate-500/20 text-slate-200';
    default:
      return 'bg-gray-500/20 text-gray-200';
  }
}

function getStatusText(status: CalendarAppointment['status']): string {
  switch (status) {
    case 'pending':
      return 'Ожидает';
    case 'confirmed':
      return 'Подтверждена';
    case 'completed':
      return 'Завершена';
    default:
      return 'Неизвестно';
  }
}