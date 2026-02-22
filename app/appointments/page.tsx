"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from 'react-hot-toast';
import SecondaryHeader from "@/components/ui/SecondaryHeader";
import { formatAppointmentPrice } from '@/utils/price-utils';
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import FireLoader from "@/components/ui/FireLoader";
import { apiClient } from "@/lib/axios";
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';

interface Appointment {
  id: number;
  appointment_date: string;
  time: string;
  status: string;
  payment_method?: string;
  final_price_charged?: number;
  original_service_price?: number;
  service: {
    name: string;
    duration_minutes: number;
    pl_price: number;
  };
  created_at: string;
}

export default function AppointmentsPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { invalidateUserAppointments } = useAppointmentInvalidation();

  // Получаем текущего пользователя из Telegram store
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  const { isLoading: telegramLoading } = useTelegramStore();

  const { data: appointments = [], isLoading: loading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/appointments');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user, // Включаем только когда есть пользователь
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await apiClient.patch(`/api/appointments/${appointmentId}/cancel`);
      return response.data;
    },
    onMutate: async (appointmentId) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments']);
      
      queryClient.setQueryData(['appointments'], (old: Appointment[]) =>
        old?.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'canceled' }
            : apt
        )
      );
      
      return { previousAppointments };
    },
    onSuccess: () => {
      toast.success('Запись успешно отменена');
    },
    onError: (error, appointmentId, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
      console.error('Cancel error:', error);
      toast.error('Не удалось отменить запись');
    },
    onSettled: () => {
      // Инвалидируем только пользовательские кэши (оптимизация UX)
      invalidateUserAppointments();
    },
  });

  // Если пользователь не авторизован, показываем загрузчик
  if (telegramLoading || !isAuthenticated || !user) {
    return <FireLoader />;
  }

  // Функция для показа модального окна подтверждения
  const handleCancelClick = (appointmentId: number) => {
    setAppointmentToCancel(appointmentId);
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;

    setShowConfirmModal(false);
    cancelAppointmentMutation.mutate(appointmentToCancel);
    setAppointmentToCancel(null);
  };

  // Функция для закрытия модального окна
  const handleCancelModalClose = () => {
    setShowConfirmModal(false);
    setAppointmentToCancel(null);
  };

  // Проверка, можно ли отменить запись
  const canCancelAppointment = (status: string) => {
    return status === 'pending' || status === 'confirmed';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          text: 'Ожидает подтверждения', 
          color: 'bg-gradient-to-r from-amber-600 to-amber-500', 
          textColor: 'text-amber-100',
          borderColor: 'border-amber-400'
        };
      case 'confirmed':
        return { 
          text: 'Подтверждена', 
          color: 'bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58]', 
          textColor: 'text-green-100',
          borderColor: 'border-[#7AB069]'
        };
      case 'canceled':
        return { 
          text: 'аннулирована', 
          color: 'bg-gradient-to-r from-[#541c15] to-[#6B2319]', 
          textColor: 'text-red-100',
          borderColor: 'border-[#8B2E20]'
        };
      case 'completed':
        return { 
          text: 'Завершена', 
          color: 'bg-gradient-to-r from-slate-600 to-slate-500', 
          textColor: 'text-slate-100',
          borderColor: 'border-slate-400'
        };
      default:
        return { 
          text: 'Неизвестно', 
          color: 'bg-gradient-to-r from-gray-600 to-gray-500', 
          textColor: 'text-gray-200',
          borderColor: 'border-gray-400'
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Warsaw'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const time = new Date(`1970-01-01T${timeStr}`);
    return time.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Warsaw'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111213] text-white px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#BBBDC0] font-montserrat">Загрузка записей...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111213] text-white px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 font-montserrat">Не удалось загрузить записи</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111213] text-white">
      {/* Header */}
      <SecondaryHeader title="Мои записи" subtitle="История ваших записей" />

      {/* Content */}
      <div className="px-4 py-6 pb-28">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#BBBDC0] text-lg font-montserrat mb-4">У вас пока нет записей</p>
            <Link href="/appointment">
              <button className="bg-white text-black px-6 py-3 rounded-xl font-montserrat font-medium hover:bg-gray-100 transition-colors">
                Записаться на услугу
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: Appointment) => {
              const statusInfo = getStatusInfo(appointment.status);
              //bg-gradient-to-r from-transparent via-white/5 to-transparent
              return (
                <div key={appointment.id} className="bg-gradient-to-br from-[#111111] to-[#0A0A0A] rounded-[20px] p-5 border border-[#333333] shadow-lg relative overflow-hidden">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-[#111111] rounded-[20px] pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-end w-full mb-3">
                      <div className={`px-3 py-1.5 rounded-xl ${statusInfo.color} shadow-sm flex-shrink-0 flex items-center justify-center border ${statusInfo.borderColor}`}>
                          <span className={`text-[9px] font-montserrat font-bold ${statusInfo.textColor} uppercase tracking-tight whitespace-nowrap drop-shadow-sm text-center`} style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)' }}>
                            {statusInfo.text}
                          </span>
                      </div>
                    </div>
                    
                    {/* Header with service name and status */}
                    <div className="flex items-start justify-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-white text-lg font-montserrat font-semibold mb-2 leading-tight">
                          {appointment.service.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[#BBBDC0] text-sm font-montserrat flex-wrap">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">{formatTime(appointment.time)}</span>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Info cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#1A1A1A] rounded-[12px] p-3 border border-[#2A2A2A]">
                        <div className="text-[#888888] text-xs font-montserrat mb-1">Длительность</div>
                        <div className="text-white font-montserrat font-medium">{appointment.service.duration_minutes} мин</div>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-[12px] p-3 border border-[#2A2A2A]">
                        <div className="text-[#888888] text-xs font-montserrat mb-1">Стоимость</div>
                        <div className="text-[#7CB895] font-montserrat font-bold text-lg">
                          {(() => {
                            const priceInfo = formatAppointmentPrice(appointment);
                            return (
                              <div className="flex flex-col">
                                <span>{priceInfo.displayText}</span>
                                {priceInfo.originalPrice && (
                                  <span className="text-xs text-[#888888] font-normal line-through">
                                    {priceInfo.originalPrice} PLN
                                  </span>
                                )}
                              </div>
                            );
                          })()} 
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer with creation date and cancel button */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A]">
                      <div className="flex items-center gap-2 text-[#888888] text-xs font-montserrat">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Создана: {new Date(appointment.created_at).toLocaleDateString('pl-PL')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {appointment.status === 'confirmed' && (
                          <div className="flex items-center gap-1 text-green-400 text-xs font-montserrat">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Готово к посещению</span>
                          </div>
                        )}
                        {canCancelAppointment(appointment.status) && (
                          <button
                            onClick={() => handleCancelClick(appointment.id)}
                            disabled={cancelAppointmentMutation.isPending}
                            className="px-3 py-1 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] disabled:from-[#3D1510] disabled:to-[#4A1713] text-red-100 text-[9px] font-montserrat font-bold rounded-lg transition-all duration-200 border border-[#8B2E20] shadow-sm uppercase tracking-tight"
                          >
                            {cancelAppointmentMutation.isPending ? 'Отменяется...' : 'Отменить'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения отмены */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111213] border border-[#333333] rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-montserrat font-semibold text-white mb-2">
                Отменить запись?
              </h3>
              <p className="text-[#BBBDC0] font-montserrat mb-6">
                Вы уверены, что хотите отменить эту запись? Это действие нельзя отменить.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelModalClose}
                  className="flex-1 px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-montserrat font-medium rounded-lg transition-colors"
                >
                  Нет, оставить
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:bg-gradient-to-r hover:from-[#6B2319] hover:to-[#7D2A1C] text-white font-montserrat font-medium rounded-lg transition-colors"
                >
                  Да, отменить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}