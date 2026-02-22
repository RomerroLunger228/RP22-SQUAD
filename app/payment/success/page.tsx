"use client";

import { Suspense, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

function PaymentSuccessContent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate subscription cache to show updated free visits count
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          {/* Иконка успеха */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">
            Оплата прошла успешно!
          </h1>
          <p className="text-[#BBBDC0] mb-8 font-montserrat">
            Ваша запись подтверждена. Детали отправлены на вашу почту.
          </p>

          {/* Кнопки действий */}
          <div className="space-y-3">
            <Link
              href="/appointments"
              className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors block text-center font-montserrat"
            >
              Мои записи
            </Link>
            
            <Link
              href="/"
              className="w-full py-4 bg-transparent border border-[#333333] text-white font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors block text-center font-montserrat"
            >
              На главную
            </Link>
          </div>

          {/* Информационное сообщение */}
          <div className="mt-8 p-4 bg-[#2A2A2A] rounded-xl">
            <p className="text-[#BBBDC0] text-sm text-center font-montserrat">
              Если у вас есть вопросы, свяжитесь с нами или приходите к назначенному времени
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#BBBDC0] font-montserrat">Загрузка...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}