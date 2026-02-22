'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, Briefcase, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient, createQueryKey } from '@/lib/axios';
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';
import { useWorkingDays } from '@/hooks/useWorkingDays';
import FakeInput from '@/components/ui/FakeInput';

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  pl_price: number;
  category_id: number;
  category_name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityResponse {
  success: boolean;
  availableSlots?: string[];
  error?: string;
}

interface CreateAppointmentRequest {
  data: {
    serviceId: number;
    appointmentDate: string;
    appointmentTime: string;
    paymentMethod: string;
    admin_created: boolean;
    is_admin: boolean;
  };
}

interface CreateAppointmentResponse {
  success: boolean;
  error?: string;
}

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSuccess?: () => void;
}

export function AdminBookingModal({ 
  isOpen, 
  onClose, 
  selectedDate,
  onSuccess 
}: AdminBookingModalProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  const queryClient = useQueryClient();
  const { invalidateAdminAppointments } = useAppointmentInvalidation();
  
  // ⚡ Оптимизация: используем кэш рабочих дней для админки
  const { getWorkingHours, isWorkingDay } = useWorkingDays();

  // Синхронизируем currentDate с selectedDate при изменении selectedDate
  if (isOpen && currentDate.getTime() !== selectedDate.getTime()) {
    setCurrentDate(selectedDate);
  }

  // Загрузка услуг
  const { 
    data: services = [], 
    isLoading: servicesLoading 
  } = useQuery({
    queryKey: createQueryKey('services'),
    queryFn: async (): Promise<Service[]> => {
      const response = await apiClient.get<Service[]>('/api/services');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Загрузка слотов времени
  const dateStr = currentDate.toISOString().split('T')[0];
  const { 
    data: availabilityData, 
    isLoading: timeSlotsLoading 
  } = useQuery({
    queryKey: createQueryKey('available-slots', { date: dateStr, serviceId: selectedService?.id }),
    queryFn: async (): Promise<AvailabilityResponse> => {
      if (!selectedService) throw new Error('Service not selected');
      
      // ⚡ ОПТИМИЗАЦИЯ: быстрая проверка выходных дней для админки
      if (!isWorkingDay(dateStr)) {
        console.log('⚡ [ADMIN_MODAL] Fast exit: non-working day', dateStr);
        return {
          success: true,
          availableSlots: [],
          error: "Выходной день"
        };
      }

      // ⚡ ОПТИМИЗАЦИЯ: передаем рабочие часы в заголовке
      const workingHours = getWorkingHours(dateStr);
      const headers: Record<string, string> = {};
      
      if (workingHours) {
        headers['x-working-hours'] = JSON.stringify({
          start_time: workingHours.start_time,
          end_time: workingHours.end_time,
          is_working: true
        });
        console.log('⚡ [ADMIN_MODAL] Using cached working hours for', dateStr);
      }
      
      const response = await apiClient.get<AvailabilityResponse>(
        `/api/available?date=${dateStr}&serviceId=${selectedService.id}`,
        { headers }
      );
      return response.data;
    },
    enabled: Boolean(selectedService && isOpen),
    staleTime: 2 * 60 * 1000, // 2 минуты
  });

  // Преобразуем данные в формат timeSlots
  const timeSlots: TimeSlot[] = availabilityData?.success && availabilityData.availableSlots 
    ? availabilityData.availableSlots.map((slot: string) => ({
        time: slot,
        available: true
      }))
    : [];

  // Мутация для создания записи
  const createAppointmentMutation = useMutation({
    mutationFn: async ({ serviceId, appointmentDate, appointmentTime }: {
      serviceId: number;
      appointmentDate: string;
      appointmentTime: string;
    }): Promise<CreateAppointmentResponse> => {
      const appointmentData: CreateAppointmentRequest = {
        data: {
          serviceId,
          appointmentDate,
          appointmentTime,
          paymentMethod: 'cash',
          admin_created: true,
          is_admin: true
        }
      };

      const response = await apiClient.post<CreateAppointmentResponse>('/api/appointment/create', appointmentData);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Запись успешно создана');
        handleClose();
        onSuccess?.();
        // Инвалидируем только админские кэши (оптимизация UX)
        invalidateAdminAppointments();
        queryClient.invalidateQueries({ queryKey: createQueryKey('available-slots') });
      } else {
        toast.error(result.error || 'Ошибка создания записи');
      }
    },
    onError: (error: Error) => {
      toast.error('Ошибка создания записи');
      console.error('Create appointment error:', error);
    }
  });

  const handleSubmit = async () => {
    if (!selectedService || !selectedTime) {
      toast.error('Выберите услугу и время');
      return;
    }

    createAppointmentMutation.mutate({
      serviceId: selectedService.id,
      appointmentDate: currentDate.toISOString().split('T')[0],
      appointmentTime: selectedTime,
    });
  };

  const handleClose = () => {
    setSelectedService(null);
    setSelectedTime('');
    setCurrentDate(selectedDate); // Сброс к первоначальной дате
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] w-full max-w-md h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <h2 className="text-white font-montserrat font-semibold text-lg">
            Создать запись
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Date Selection */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Calendar className="w-4 h-4 text-[#BBBDC0]" />
              Дата записи
            </label>
            <FakeInput
              type="date"
              value={currentDate.toISOString().split('T')[0]}
              onChange={(value) => {
                const newDate = new Date(value + 'T12:00:00');
                setCurrentDate(newDate);
                setSelectedTime(''); // Сброс выбранного времени при смене даты
              }}
              min={new Date().toISOString().split('T')[0]}
              placeholder="Выберите дату записи"
              aria-label="Дата записи"
            />
          </div>

          {/* Service Selection */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Briefcase className="w-4 h-4 text-[#BBBDC0]" />
              Услуга
            </label>
            
            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            ) : services && services.length > 0 ? (
              <div className="space-y-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      selectedService?.id === service.id
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-[#2A2A2A] border-[#333333] text-[#BBBDC0] hover:border-white/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{service.name || 'Без названия'}</p>
                        <p className="text-xs opacity-70">
                          {service.duration_minutes || 0} мин • {service.category_name || 'Без категории'}
                        </p>
                      </div>
                      <p className="text-sm font-medium">{service.pl_price || 0} PLN</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#BBBDC0]">
                <p>Нет доступных услуг</p>
              </div>
            )}
          </div>

          {/* Time Selection */}
          {selectedService && (
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Clock className="w-4 h-4 text-[#BBBDC0]" />
                Время
              </label>
              
              {timeSlotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.filter(slot => slot.available).map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-2 rounded-lg border transition-colors text-sm ${
                        selectedTime === slot.time
                          ? 'bg-white text-black'
                          : 'bg-[#2A2A2A] border-[#333333] text-[#BBBDC0] hover:border-white/40'
                      }`}
                    >
                      {slot.time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              )}
              
              {selectedService && timeSlots.length > 0 && timeSlots.filter(slot => slot.available).length === 0 && (
                <div className="text-center py-8 text-[#BBBDC0]">
                  <p>Нет доступных слотов на эту дату</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-white font-medium rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedService || !selectedTime || createAppointmentMutation.isPending}
            className="flex-1 px-4 py-2 bg-white hover:bg-white/90 disabled:bg-[#333333] disabled:text-[#666666] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {createAppointmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание...
              </>
            ) : (
              'Создать запись'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}