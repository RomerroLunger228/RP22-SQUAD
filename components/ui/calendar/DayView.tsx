// components/ui/calendar/DayView.tsx

import { CalendarAppointment, CalendarBlockedTime, WorkingHours } from '@/types/calendar';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatAppointmentPrice } from '@/utils/price-utils';

interface DayData {
  date: Date;
  dateString: string;
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  workingHours: WorkingHours | null;
  isToday: boolean;
  isWorkingDay: boolean;
}

interface DayViewProps {
  dayData: DayData;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
}

export function DayView({ dayData, onAppointmentClick }: DayViewProps) {
  // Создаем временную сетку, включающую ВСЕ записи
  const generateTimeSlots = () => {
    const slots = new Set<string>(); // Используем Set чтобы избежать дубликатов
    
    if (!dayData.workingHours) {
      // Если нет рабочих часов, но есть записи, добавляем времена из записей
      dayData.appointments.forEach(apt => {
        slots.add(apt.time);
      });
      return Array.from(slots).sort();
    }

    const [startHour, startMin] = dayData.workingHours.start_time.split(':').map(Number);
    const [endHour, endMin] = dayData.workingHours.end_time.split(':').map(Number);
    
    // Сначала добавляем стандартные слоты каждые 30 минут
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.add(timeString);
      
      currentMin += 30; // Интервал 30 минут
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    // ВАЖНО: Добавляем времена ВСЕх записей, даже если они не в стандартных слотах
    dayData.appointments.forEach(apt => {
      slots.add(apt.time);
    });

    // Добавляем времена заблокированных периодов
    dayData.blockedTimes.forEach(bt => {
      slots.add(bt.start_time);
    });

    return Array.from(slots).sort();
  };

  const timeSlots = generateTimeSlots();

  const formatDayTitle = (date: Date, isToday: boolean) => {
    const dayName = date.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dayDate = date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long' 
    });
    
    if (isToday) {
      return `Сегодня, ${dayDate}`;
    }
    
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayDate}`;
  };

  // Проверяем, есть ли запись, которая НАЧИНАЕТСЯ в это время
  const getAppointmentStartingAtTime = (timeString: string) => {
    return dayData.appointments.find(apt => apt.time === timeString);
  };


  // Утилита для конвертации времени в минуты
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Получаем запись, которая активна в данный момент времени
  const getActiveAppointmentAtTime = (timeString: string) => {
    const timeInMinutes = timeToMinutes(timeString);
    
    return dayData.appointments.find(apt => {
      const appointmentStart = timeToMinutes(apt.time);
      const appointmentEnd = appointmentStart + apt.service.duration_minutes;
      return timeInMinutes >= appointmentStart && timeInMinutes < appointmentEnd;
    });
  };

  const getBlockedTimeAtSlot = (timeString: string) => {
    return dayData.blockedTimes.find(bt => {
      const slotTime = timeString.replace(':', '');
      const startTime = bt.start_time.replace(':', '');
      const endTime = bt.end_time.replace(':', '');
      return slotTime >= startTime && slotTime < endTime;
    });
  };

  const getStatusColor = (status: CalendarAppointment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      case 'confirmed':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'completed':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'no_show':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
      case 'canceled':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  if (!dayData.isWorkingDay) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-xl font-montserrat font-bold text-white mb-2">
            {formatDayTitle(dayData.date, dayData.isToday)}
          </h3>
          <p className="text-white/60 font-montserrat">
            Выходной день
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Day Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`
            w-3 h-3 rounded-full
            ${dayData.isToday ? 'bg-white' : 'bg-white/40'}
          `}></div>
          <h3 className="text-lg font-montserrat font-bold text-white">
            {formatDayTitle(dayData.date, dayData.isToday)}
          </h3>
        </div>
        
        {dayData.workingHours && (
          <div className="flex items-center gap-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-montserrat">
              Рабочие часы: {dayData.workingHours.start_time} - {dayData.workingHours.end_time}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-[#BBBDC0] font-montserrat">
            Записей: <span className="text-white font-medium">{dayData.appointments.length}</span>
          </span>
          {dayData.blockedTimes.length > 0 && (
            <span className="text-[#BBBDC0] font-montserrat">
              Блокировок: <span className="text-[#888888] font-medium">{dayData.blockedTimes.length}</span>
            </span>
          )}
        </div>
      </div>

      {/* Time Grid */}
      <div className="max-h-[70vh] overflow-y-auto">
        {timeSlots.map((timeSlot) => {
          const appointmentStarting = getAppointmentStartingAtTime(timeSlot);
          const activeAppointment = getActiveAppointmentAtTime(timeSlot);
          const blockedTime = getBlockedTimeAtSlot(timeSlot);
          
          // Если есть запись, которая НАЧИНАЕТСЯ в это время
          if (appointmentStarting) {
            const durationSlots = Math.ceil(appointmentStarting.service.duration_minutes / 30);
            
            return (
              <div 
                key={timeSlot}
                className="flex border-b border-white/5"
                style={{ minHeight: `${60 * durationSlots}px` }}
              >
                {/* Time Column */}
                <div className="w-16 flex-shrink-0 p-3 border-r border-white/10">
                  <span className="text-sm font-mono text-white/60">
                    {timeSlot}
                  </span>
                </div>

                {/* Content Column */}
                <div className="flex-1 p-3 flex items-stretch">
                  <button
                    onClick={() => onAppointmentClick(appointmentStarting)}
                    className={`
                      w-full text-left p-4 rounded-lg border transition-all duration-200
                      hover:scale-[1.02] hover:shadow-lg cursor-pointer
                      ${getStatusColor(appointmentStarting.status)}
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-montserrat font-semibold">
                        {appointmentStarting.service.name}
                      </span>
                      <span className="text-xs opacity-80">
                        {appointmentStarting.service.duration_minutes} мин
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm opacity-90 mb-2">
                      <span>
                        {(() => {
                          const priceInfo = formatAppointmentPrice(appointmentStarting);
                          return (
                            <div className="flex flex-col">
                              <span>{priceInfo.displayText}</span>
                              {priceInfo.originalPrice && (
                                <span className="text-xs opacity-60 line-through">{priceInfo.originalPrice} PLN</span>
                              )}
                            </div>
                          );
                        })()}
                      </span>
                      <span className="capitalize">
                        {appointmentStarting.status === 'pending' && 'Ожидает'}
                        {appointmentStarting.status === 'confirmed' && 'Подтверждена'}
                        {appointmentStarting.status === 'completed' && 'Завершена'}
                        {appointmentStarting.status === 'no_show' && 'Неявка'}
                        {appointmentStarting.status === 'canceled' && 'Отменена'}
                      </span>
                    </div>

                    <div className="text-xs opacity-70">
                      {timeSlot} - {(() => {
                        const endTime = timeToMinutes(timeSlot) + appointmentStarting.service.duration_minutes;
                        const endHour = Math.floor(endTime / 60);
                        const endMin = endTime % 60;
                        return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
                      })()}
                    </div>
                  </button>
                </div>
              </div>
            );
          }
          
          // Если это время занято продолжающейся записью, пропускаем
          if (activeAppointment && activeAppointment.time !== timeSlot) {
            return null;
          }
          
          // Обычный пустой слот или заблокированное время
          return (
            <div 
              key={timeSlot}
              className="flex border-b border-white/5 hover:bg-white/5 transition-colors min-h-[60px]"
            >
              {/* Time Column */}
              <div className="w-16 flex-shrink-0 p-3 border-r border-white/10">
                <span className="text-sm font-mono text-white/60">
                  {timeSlot}
                </span>
              </div>

              {/* Content Column */}
              <div className="flex-1 p-3 flex items-center">
                {blockedTime ? (
                  <div className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-[#888888]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-montserrat">Заблокировано</span>
                      <span className="text-xs opacity-80 font-montserrat">
                        до {blockedTime.end_time}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-80 font-montserrat">
                      {blockedTime.reason}
                    </p>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center">
                    <span className="text-[#555555] text-sm font-montserrat">
                      Свободно
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>


      {/* Empty State */}
      {timeSlots.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60 font-montserrat">
            Рабочие часы не установлены
          </p>
        </div>
      )}
    </div>
  );
}