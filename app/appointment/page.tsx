// app/book/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookingStep, Service, BookingData } from "@/types/booking";
import { MobileStepper } from "@/components/ui/MobileStepper";
import { MobileServiceSelection } from "@/components/ui/MobileServiceSelection";
import { MobileDateTimeSelection } from "@/components/ui/MobileDateTimeSelection";
import { MobileConfirmation } from "@/components/ui/MobileConfirmation";
import { formatTimeForDisplay } from "@/lib/date-utils";
import { createAppointment, getActiveAppointments, createStripeCheckout } from "@/utils/fetchAmounts";
import { fetchServices } from "@/utils/fetchServices";
import { useRouter } from "next/navigation";
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import FireLoader from "@/components/ui/FireLoader";
import toast from 'react-hot-toast';
import { useAppointmentInvalidation } from '@/hooks/useAppointmentInvalidation';

export default function MobileBookingPage() {
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE_SELECTION);
  const router = useRouter();
  const { invalidateUserAppointments } = useAppointmentInvalidation();

  // Получаем текущего пользователя из Telegram store
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  const { isLoading: telegramLoading } = useTelegramStore();

  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    date: null,
    timeSlot: null,
  });

  // Загружаем услуги с помощью TanStack Query - ВСЕГДА вызываем hooks
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 10 * 60 * 1000, // 10 минут - услуги редко изменяются
    enabled: !!user, // Включаем только когда есть пользователь
  });

  // Проверяем активные записи с помощью TanStack Query
  const { data: activeAppointments = [] } = useQuery({
    queryKey: ['activeAppointments', user?.id],
    queryFn: () => getActiveAppointments(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 секунд - активные записи нужно проверять часто
  });


  // Если пользователь не авторизован, показываем загрузчик
  if (telegramLoading || !isAuthenticated || !user) {
    return <FireLoader />;
  }

  // Обработчик выбора услуги
  const handleServiceSelect = (service: Service) => {
    setBookingData({
      ...bookingData,
      service,
    });
    setStep(BookingStep.DATE_TIME_SELECTION);
  };

  // Обработчик выбора даты и времени
  const handleDateTimeSelect = (date: Date, timeSlot: string) => {
  // Форматируем дату для отображения (локальное время)
      const formattedDate = date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Форматируем время
      const formattedTime = formatTimeForDisplay(timeSlot);
      
      setBookingData({
        ...bookingData,
        date,
        timeSlot,
        formattedTime,
        formattedDate
      });
      
      setStep(BookingStep.CONFIRMATION);
};

  // Обработчик подтверждения записи
  const handleBookingConfirm = async (paymentMethod: string) => {
  if (!bookingData.service || !bookingData.date || !bookingData.timeSlot) {
    alert("Пожалуйста, заполните все поля");
    return;
  }

  try {
    // Проверяем активные записи пользователя перед созданием новой (данные уже загружены через TanStack Query)
    if (activeAppointments && activeAppointments.length > 0) {
      toast.error('У вас уже есть активная запись. Пожалуйста, завершите или отмените её перед созданием новой.', {
        duration: 5000,
      });
      return;
    }
    // Форматируем время
    let timeString = bookingData.timeSlot;
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      timeString = parts.slice(0, 2).join(':');
    }
    
    // ВАЖНО: Правильное форматирование даты для избежания сдвига
    const date = bookingData.date;
    
    // Способ 1: Используем локальное форматирование даты
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // месяцы 0-11
    const day = String(date.getDate()).padStart(2, '0'); // getDate() возвращает день месяца
    
    const dateString = `${year}-${month}-${day}`;
    
    // Способ 2: Альтернативный вариант с Intl.DateTimeFormat
    // const dateString = new Intl.DateTimeFormat('en-CA', { // en-CA дает формат YYYY-MM-DD
    //   year: 'numeric',
    //   month: '2-digit',
    //   day: '2-digit'
    // }).format(date);
    
    console.log('Date formatting:', {
      originalDate: date,
      originalLocale: date.toLocaleDateString('ru-RU'),
      originalISO: date.toISOString(),
      getFullYear: date.getFullYear(),
      getMonth: date.getMonth(),
      getDate: date.getDate(),
      formatted: dateString
    });
    
    const appointmentData = {
      serviceId: bookingData.service.id,
      appointmentDate: dateString, // Используем правильно отформатированную дату
      appointmentTime: timeString,
      paymentMethod: paymentMethod
    };

    console.log('Sending appointment data:', appointmentData);
    
    // Если выбрана онлайн оплата картой - сначала создаем checkout
    if (paymentMethod === 'card') {
      try {
        // Сначала создаем Stripe checkout (БЕЗ создания appointment)
        const checkoutData = await createStripeCheckout({
          serviceId: bookingData.service.id,
          appointmentDate: dateString,
          appointmentTime: timeString,
          paymentMethod: 'card'
        });

        if (checkoutData.url) {
          // Перенаправляем на Stripe checkout
          window.location.href = checkoutData.url;
          return;
        } else {
          throw new Error('Failed to create checkout session');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Ошибка при создании сессии оплаты');
        return;
      }
    }
    
    // Для наличных и подписки создаем запись сразу
    const result = await createAppointment(appointmentData);
    
    console.log('Appointment result:', result);
    
    // Инвалидируем только пользовательские кэши (оптимизация UX)
    invalidateUserAppointments();
    
    // Если выбрана оплата подпиской (только для бесплатных визитов) - пропускаем чекаут
    if (paymentMethod === 'subscription') {
      const localDateStr = date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Показываем тост об успешной записи с бесплатным визитом
      toast.success(`Запись создана бесплатно по подписке!\nУслуга: ${bookingData.service.name}\nДата: ${localDateStr}\nВремя: ${timeString}`, {
        duration: 4000,
      });
      
      // Редирект на главную страницу
      setTimeout(() => {
        router.push('/');
      }, 1000);
      return;
    }
    
    // Показываем подтверждение с локальной датой для наличной оплаты
    const localDateStr = date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    // Показываем тост об успешной записи
    let successMessage = `Запись успешно создана!\nУслуга: ${bookingData.service.name}\nДата: ${localDateStr}\nВремя: ${timeString}`;
    
    // Добавляем информацию о скидке если есть
    if (result.subscriptionBenefit?.type === 'discount') {
      successMessage += `\nПрименена скидка по подписке! Цена: ${result.subscriptionBenefit.price} PLN`;
    }
    
    toast.success(successMessage, {
      duration: 4000,
    });
    
    // Редирект на главную страницу
    setTimeout(() => {
      router.push('/');
    }, 1000);
    
    
  } catch (error: unknown) {
    console.error("Ошибка при создании записи:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Произошла ошибка при создании записи: ${errorMessage}`);
  }
};

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Хедер с шагами */}
      <div className="sticky top-0 z-10 bg-black border-b border-[#222222]">
        <MobileStepper
          currentStep={step}
          serviceSelected={!!bookingData.service}
          dateTimeSelected={!!bookingData.date && !!bookingData.timeSlot}
        />
      </div>

      {/* Контент шагов */}
      <div className="max-w-md mx-auto">
        {/* Шаг 1: Выбор услуги */}
        {step === BookingStep.SERVICE_SELECTION && (
          
          <MobileServiceSelection
            services={services}
            selectedService={bookingData.service}
            onSelect={handleServiceSelect}
            isLoading={isLoading}
            userId={user.id}
          />
        )}

        {/* Шаг 2: Выбор даты и времени */}
        {step === BookingStep.DATE_TIME_SELECTION && bookingData.service && (
          <MobileDateTimeSelection
            serviceId={bookingData.service.id}
            selectedDate={bookingData.date}
            selectedTime={bookingData.timeSlot}
            onSelect={handleDateTimeSelect}
            onBack={() => setStep(BookingStep.SERVICE_SELECTION)}
          />
        )}

        {/* Шаг 3: Подтверждение */}
        {step === BookingStep.CONFIRMATION && bookingData.service && bookingData.date && bookingData.timeSlot && (
          <MobileConfirmation
            bookingData={bookingData}
            onConfirm={handleBookingConfirm}
            onBack={() => setStep(BookingStep.DATE_TIME_SELECTION)}
          />
        )}
      </div>

      {/* Дебаг информация (только разработка) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-[#1A1A1A] p-3 rounded-lg text-xs opacity-70">
          <div className="font-montserrat">Шаг: {step}/3</div>
          <div className="font-montserrat">Услуга: {bookingData.service?.name || "не выбрана"}</div>
          <div className="font-montserrat">Дата: {bookingData.date?.toLocaleDateString() || "не выбрана"}</div>
          <div className="font-montserrat">Время: {bookingData.timeSlot || "не выбрано"}</div>
        </div>
      )}
    </div>
  );
}