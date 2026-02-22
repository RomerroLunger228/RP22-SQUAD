// components/ui/calendar/ModernAppointmentCard.tsx

import { CalendarAppointment } from '@/types/calendar';
import { formatAppointmentTime } from './utils/calendarUtils';

interface ModernAppointmentCardProps {
  appointment: CalendarAppointment;
  onClick: (appointment: CalendarAppointment) => void;
}

export function ModernAppointmentCard({ appointment, onClick }: ModernAppointmentCardProps) {
  const time = formatAppointmentTime(appointment);

  const getStatusColor = (status: CalendarAppointment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      case 'confirmed':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'completed':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(appointment);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        w-full text-xs px-2 py-1.5 rounded-lg cursor-pointer
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${getStatusColor(appointment.status)} border
        font-montserrat
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono opacity-90">
          {time}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
      </div>
      <div className="truncate text-xs mt-0.5 font-medium">
        {appointment.service.name}
      </div>
    </div>
  );
}