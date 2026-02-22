// components/ui/calendar/AppointmentModal.tsx

import { useState, useEffect } from 'react';
import { CalendarAppointment, APPOINTMENT_COLORS } from '@/types/calendar';
import { formatAppointmentTime } from './utils/calendarUtils';
import { X, Calendar, Clock, User, CreditCard, DollarSign, Tag } from 'lucide-react';
import { formatAppointmentPrice } from '@/utils/price-utils';
import toast from 'react-hot-toast';

interface AppointmentModalProps {
  appointment: CalendarAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (appointmentId: number, newStatus: CalendarAppointment['status']) => Promise<void>;
}

export function AppointmentModal({ appointment, isOpen, onClose, onStatusUpdate }: AppointmentModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      requestAnimationFrame(() => setIsAnimating(false));
    }
  }, [isOpen]);

  const copyToClipboard = async (username: string) => {
    try {
      await navigator.clipboard.writeText(username);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success('Имя пользователя скопировано');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

if (!isOpen || !appointment) return null;

  const colorClasses = APPOINTMENT_COLORS[appointment.status];
  const time = formatAppointmentTime(appointment);
  
  // Форматируем дату
  const appointmentDate = new Date(appointment.appointment_date);
  const formattedDate = appointmentDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleClose = () => {
    setIsAnimating(false);
    setIsUpdating(false); // Сбрасываем loading состояние при закрытии
    // Ждем окончания анимации перед вызовом onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleStatusUpdate = async (newStatus: CalendarAppointment['status']) => {
    if (!appointment || !onStatusUpdate || isUpdating || !appointment.id) {
      console.error('Cannot update appointment: missing appointment data or ID', { appointment });
      return;
    }
    
    try {
      setIsUpdating(true);
      await onStatusUpdate(appointment.id, newStatus);
      // Успешное обновление - закрываем модал и сбрасываем состояние
      setIsUpdating(false);
      handleClose();
    } catch (error) {
      console.error('Error updating status:', error);
      setIsUpdating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[60] backdrop-blur-sm transition-all duration-300
        ${isAnimating ? 'bg-black/60' : 'bg-black/0'}
      `}
      onClick={handleBackdropClick}
    >
      <div className={`
        fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2A2A2A] 
        shadow-2xl transform transition-all duration-300 ease-out
        rounded-t-3xl overflow-hidden flex flex-col z-[60]
        ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ height: '90vh' }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Indicator */}
        <div className="flex justify-center py-3 bg-[#1A1A1A]">
          <div className="w-12 h-1 bg-[#666666] rounded-full"></div>
        </div>

        {/* Header */}
        <div className={`${colorClasses} p-4 relative flex flex-col gap-1`}>
          <button 
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center 
                     rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="text-white">
            <h2 className="text-lg font-montserrat font-bold mb-2">
              {appointment.service.name}
            </h2>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 mt-1 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium font-mono">{time}</span>
              <span className="text-sm">({appointment.service.duration_minutes} мин)</span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#BBBDC0]" />
            </div>
            <div>
              <p className="text-[#BBBDC0] text-xs font-medium">Статус записи</p>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <User className="w-4 h-4 text-[#BBBDC0]" />
            </div>
            <div>
              <p className="text-[#BBBDC0] text-xs font-medium">Клиент</p>
              <p className="text-white font-montserrat font-medium text-sm">
                {appointment.username ? (
                  <button
                    onClick={() => copyToClipboard(appointment.username!)}
                    className="flex items-center gap-1 hover:text-white/80 transition-colors"
                    title={copySuccess ? "Скопировано!" : "Копировать имя пользователя"}
                  >
                    <span className="font-semibold">@{appointment.username}</span>
                    <span className="text-[#BBBDC0] text-xs ml-2">ID: {appointment.user_id}</span>
                  </button>
                ) : (
                  `ID: ${appointment.user_id}`
                )}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#BBBDC0]" />
            </div>
            <div>
              <p className="text-[#BBBDC0] text-xs font-medium">Стоимость</p>
              <p className="text-white font-montserrat font-semibold text-base">
                {(() => {
                  const priceInfo = formatAppointmentPrice(appointment);
                  return (
                    <span className="flex flex-col">
                      <span>{priceInfo.displayText}</span>
                      {priceInfo.originalPrice && (
                        <span className="text-xs text-[#BBBDC0] opacity-80 line-through">{priceInfo.originalPrice} PLN</span>
                      )}
                    </span>
                  );
                })()}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          {appointment.payment_method && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#BBBDC0]" />
              </div>
              <div>
                <p className="text-[#BBBDC0] text-xs font-medium">Способ оплаты</p>
                <p className="text-white font-montserrat font-medium capitalize text-sm">
                  {getPaymentMethodText(appointment.payment_method)}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#1A1A1A] space-y-4">
          {/* Main Status Actions */}
          {onStatusUpdate && (
            <div className="space-y-6">
              {/* Pending Appointment Actions */}
              {appointment.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate('canceled')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Обновление...' : 'Отменить'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Обновление...' : 'Подтвердить'}
                  </button>
                </div>
              )}

              {/* Confirmed Appointment Actions */}
              {appointment.status === 'confirmed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate('no_show')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Обновление...' : 'Отметить неявку'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58] hover:from-[#5A9449] hover:to-[#76A863] text-white font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Обновление...' : 'Завершить'}
                  </button>
                </div>
              )}
            
              {/* No Show Appointment Actions */}
              {appointment.status === 'no_show' && (
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58] hover:from-[#5A9449] hover:to-[#76A863] text-white font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isUpdating ? 'Обновение...' : 'Подтвердить явку'}
                </button>
              )}

              {/* Universal Cancel Button for Admin - Available for any status except already canceled */}
              {appointment.status !== 'canceled' && (
                <button
                  onClick={() => handleStatusUpdate('canceled')}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] border border-red-500/30 text-white font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Принудительная отмена записи (админ)"
                >
                  {isUpdating ? 'Обновление...' : (appointment.status === 'pending' ? 'Отменить' : 'Аннулировать')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: CalendarAppointment['status']): string {
  switch (status) {
    case 'pending':
      return 'Ожидает подтверждения';
    case 'confirmed':
      return 'Подтверждена';
    case 'completed':
      return 'Завершена';
    case 'no_show':
      return 'Неявка';
    case 'canceled':
      return 'Отменена';
    default:
      return 'Неизвестный статус';
  }
}

function getStatusBadgeStyle(status: CalendarAppointment['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'confirmed':
      return 'bg-green-500/20 text-green-300 border border-green-500/30';
    case 'completed':
      return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    case 'no_show':
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30 opacity-70';
    case 'canceled':
      return 'bg-red-500/20 text-red-300 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  }
}

function getPaymentMethodText(method: string): string {
  switch (method.toLowerCase()) {
    case 'cash':
      return 'Наличные';
    case 'card':
      return 'Карта';
    case 'usdt':
      return 'USDT';
    case 'ton':
      return 'TON';
    default:
      return method;
  }
}