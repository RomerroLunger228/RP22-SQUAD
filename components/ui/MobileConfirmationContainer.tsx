
"use client";

import { BookingData } from "@/types/booking";
import { ChevronLeft } from "lucide-react";
import { useBookingConfirmation } from "@/hooks/useBookingConfirmation";
import { ServiceSummary } from "./ServiceSummary";
import { PriceSummary } from "./PriceSummary";
import { PaymentOptions } from "./PaymentOptions";

interface MobileConfirmationContainerProps {
  bookingData: BookingData;
  onConfirm: (paymentMethod: string) => void;
  onBack: () => void;
}


export function MobileConfirmationContainer({
  bookingData,
  onConfirm,
  onBack
}: MobileConfirmationContainerProps) {
  const {
    selectedPayment,
    setSelectedPayment,
    priceCalculation,
    priceLoading,
    formatDateFull,
  } = useBookingConfirmation(bookingData);

  if (!bookingData.service || !bookingData.date || !bookingData.timeSlot) {
    return (
      <div className="px-4 py-3">
        <div className="text-center py-12">
          <div className="text-[#555555] text-4xl mb-4">❌</div>
          <p className="text-white text-lg mb-2 font-montserrat">Неполные данные</p>
          <p className="text-[#BBBDC0] font-montserrat">Пожалуйста, заполните все поля</p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-3 bg-white text-black font-medium rounded-xl"
          >
            <span className="font-montserrat">Вернуться назад</span>
          </button>
        </div>
      </div>
    );
  }

  const getButtonText = () => {
    if (selectedPayment === "subscription") {
      return priceCalculation?.type === 'free' 
        ? "Забронировать бесплатно" 
        : "Забронировать со скидкой";
    }
    if (selectedPayment === "cash") {
      return "Забронировать";
    }
    return "Перейти к оплате";
  };

  const getInfoMessage = () => {
    if (selectedPayment === "subscription") {
      return priceCalculation?.type === 'free'
        ? "Запись будет забронирована бесплатно с использованием подписки"
        : "Запись будет забронирована со скидкой по подписке";
    }
    if (selectedPayment === "cash") {
      return "Оплата производится на месте после оказания услуги";
    }
    return "После подтверждения вы будете перенаправлены на безопасную страницу оплаты";
  };

  return (
    <div className="px-4 py-3">
      {/* 🧭 ХЕДЕР - точно такой же как в оригинале (строки 125-139) */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white font-montserrat">Подтверждение записи</h1>
            <p className="text-[#BBBDC0] text-sm font-montserrat">Проверьте данные перед подтверждением</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6">
        <ServiceSummary 
          bookingData={bookingData} 
          formatDateFull={formatDateFull} 
        />

        <PriceSummary 
          bookingData={bookingData}
          priceCalculation={priceCalculation}
          priceLoading={priceLoading}
        />
      </div>

      {/* 💳 ВЫБОР СПОСОБА ОПЛАТЫ - сложный компонент вынесен отдельно */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6">
        <PaymentOptions
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          priceCalculation={priceCalculation}
        />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onConfirm(selectedPayment)}
          className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200"
        >
          <span className="font-montserrat">{getButtonText()}</span>
        </button>
        
        <button
          onClick={onBack}
          className="w-full py-4 bg-transparent border border-[#333333] text-white font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors"
        >
          <span className="font-montserrat">Изменить время</span>
        </button>
      </div>

      <div className="mt-6 p-4 bg-[#2A2A2A] rounded-xl">
        <p className="text-[#BBBDC0] text-sm text-center font-montserrat">
          {getInfoMessage()}
        </p>
      </div>
    </div>
  );
}
