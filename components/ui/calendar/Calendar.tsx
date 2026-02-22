// components/ui/calendar/Calendar.tsx

'use client';

import { useDayView } from './hooks/useDayView';
import { WeekNavigator } from './WeekNavigator';
import { DayView } from './DayView';
import { AppointmentModal } from './AppointmentModal';
import { AdminBookingModal } from './AdminBookingModal';
import { Calendar as CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { CalendarAppointment } from '@/types/calendar';

interface CalendarProps {
  onStatusUpdate?: (appointmentId: number, newStatus: CalendarAppointment['status']) => Promise<void>;
}

export function Calendar({ onStatusUpdate }: CalendarProps) {
  const {
    selectedDate,
    dayData,
    weekDays,
    loading,
    error,
    selectDate,
    navigateToToday,
    navigateToNextWeek,
    navigateToPrevWeek,
    selectAppointment,
    refreshData,
    selectedAppointment,
    isModalOpen,
    closeModal,
    isAdminBookingModalOpen,
    openAdminBookingModal,
    closeAdminBookingModal
  } = useDayView();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-8 h-8 text-[#4F8A3E] animate-spin" />
        <p className="text-white/60 font-montserrat">Загрузка календаря...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-montserrat font-semibold text-lg mb-2">
            Ошибка загрузки
          </h3>
          <p className="text-white/60 font-montserrat mb-4">
            {error}
          </p>
          <button
            onClick={refreshData}
            className="
              px-4 py-2 bg-[#4F8A3E] hover:bg-[#5A9449] 
              text-white font-montserrat font-medium rounded-lg
              transition-colors duration-200
            "
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-0">
      {/* Week Navigator */}
      <WeekNavigator
        weekDays={weekDays}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onPrevWeek={navigateToPrevWeek}
        onNextWeek={navigateToNextWeek}
        onToday={navigateToToday}
        onAddAppointment={openAdminBookingModal}
      />

      {/* Day View */}
      <div className="px-0">
        <DayView
          dayData={dayData}
          onAppointmentClick={selectAppointment}
        />
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={closeModal}
        onStatusUpdate={onStatusUpdate}
      />

      {/* Admin Booking Modal */}
      <AdminBookingModal
        isOpen={isAdminBookingModalOpen}
        onClose={closeAdminBookingModal}
        selectedDate={selectedDate}
        onSuccess={refreshData}
      />
    </div>
  );
}