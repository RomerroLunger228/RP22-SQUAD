"use client";

import { XCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Иконка отмены */}
        <div className="w-20 h-20 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-white" />
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">
          Оплата отменена
        </h1>
        <p className="text-[#BBBDC0] mb-8 font-montserrat">
          Процесс оплаты был прерван. Ваша запись не была подтверждена.
        </p>

        {/* Информационное сообщение */}
        <div className="bg-[#1A1A1A] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 font-montserrat">
            Что дальше?
          </h2>
          <div className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#635BFF] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-[#BBBDC0] text-sm font-montserrat">
                Ваши данные сохранены, вы можете повторить попытку оплаты
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#635BFF] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-[#BBBDC0] text-sm font-montserrat">
                Или выберите другой способ оплаты при новой записи
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#635BFF] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-[#BBBDC0] text-sm font-montserrat">
                Свяжитесь с нами, если у вас возникли проблемы с оплатой
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
          <Link
            href="/appointment"
            className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-montserrat"
          >
            <RefreshCw className="w-5 h-5" />
            Попробовать снова
          </Link>
          
          <Link
            href="/"
            className="w-full py-4 bg-transparent border border-[#333333] text-white font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2 font-montserrat"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 p-4 bg-[#2A2A2A] rounded-xl">
          <p className="text-[#BBBDC0] text-sm text-center font-montserrat">
            Если вы столкнулись с техническими проблемами, попробуйте использовать другую карту или обратитесь в службу поддержки
          </p>
        </div>

        {/* Способы связи */}
        <div className="mt-6">
          <p className="text-[#888888] text-xs font-montserrat mb-2">
            Нужна помощь?
          </p>
          <div className="flex justify-center space-x-6">
            <a 
              href="#" 
              className="text-[#635BFF] text-sm font-montserrat hover:underline"
            >
              Связаться с нами
            </a>
            <a 
              href="#" 
              className="text-[#635BFF] text-sm font-montserrat hover:underline"
            >
              FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}