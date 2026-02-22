"use client";

import { useState } from "react";
import { IconCopy, IconShare } from "@/components/icons/Icons";

interface ReferralLinkCardProps {
  referralLink: string;
}

export default function ReferralLinkCard({ referralLink }: ReferralLinkCardProps) {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareReferralLink = () => {
    // Проверяем что мы в Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Создаем Telegram share URL для нативного шаринга
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`;
      
      try {
        // Используем нативный Telegram шаринг
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } catch (err) {
        console.error('Error sharing via Telegram:', err);
        copyToClipboard(); // Fallback к копированию
      }
    } else if (navigator.share) {
      // Fallback для обычных браузеров
      navigator.share({
        title: 'Присоединяйся к нашему барбершопу!',
        text: 'Получи бонусные поинты за регистрацию по моей ссылке',
        url: referralLink,
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-2xl p-6 mb-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
      {/* Header Section */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-white font-montserrat text-center">
          Реферальная программа
        </h3>
        
        {/* Bright referral card similar to MembershipCard */}
        <div className="relative w-full max-w-[400px] bg-[#111213] border border-[#333333] rounded-2xl p-6 shadow-lg ">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4">
              <IconShare className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2 font-montserrat">
              Приглашай друзей
            </h4>
            <p className="text-[#BBBDC0] text-md font-medium leading-relaxed">
              Получай бонусы за каждого<br />
              приведенного друга
            </p>
          </div>
        </div>

        {/* Benefits display */}
        <div className="flex w-full justify-center">
          <div className="text-center">
            <div className="text-white font-bold text-lg">+10</div>
            <div className="text-sm text-[#BBBDC0] -mt-1">бонусных баллов</div>
          </div>
          
        </div>
      </div>
      
      {/* Link Display Section */}
      <div className="mb-6">
        <p className="text-white text-sm font-montserrat mb-3 text-center">
          Твоя реферальная ссылка
        </p>
        <div className="bg-[#111213] border border-[#333333] rounded-lg px-4 py-3">
          <p className="text-[#BBBDC0] text-sm font-mono truncate text-center">
            {referralLink}
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="flex-1 h-[44px] bg-[#FFFFFF] rounded-[12px] flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <IconCopy className="w-4 h-4 mr-2 text-black" />
          <span className="text-[16px] font-montserrat font-medium text-[#000000]">
            {copySuccess ? "Скопировано!" : "Копировать"}
          </span>
        </button>
        
        <button
          onClick={shareReferralLink}
          className="h-[44px] bg-[#FFFFFF] rounded-[12px] flex items-center justify-center px-4 hover:bg-gray-200 transition-colors"
        >
          <IconShare className="w-4 h-4 mr-2 text-gray-700" />
          <span className="text-[16px] font-montserrat font-medium text-black">
            Поделиться
          </span>
        </button>
      </div>
    </div>
  );
}