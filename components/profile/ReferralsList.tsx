"use client";

import Image from "next/image";
import { IconUser } from "@/components/icons/Icons";

interface Referral {
  id: number;
  username: string;
  points?: number;
  joinedDate?: string;
  avatar_url?: string;
  completedVisits?: number; // 🎁 Количество завершенных визитов
}

interface ReferralsListProps {
  referrals: Referral[];
}

export default function ReferralsList({ referrals }: ReferralsListProps) {
  return (
    <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-2xl p-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.4s' }}>
      <h3 className="text-xl font-montserrat font-bold text-white mb-4">
        Приглашенные друзья
      </h3>
      
      {referrals.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {referrals.map((referral, index) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-4 bg-[#1A1B1C] border border-[#2A2A2A] rounded-xl hover:bg-gray-50 transition-colors shadow-sm animate-slideLeft"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                {referral.avatar_url ? (
                  <Image
                    src={referral.avatar_url}
                    alt={referral.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-montserrat font-bold">
                      {referral.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-montserrat font-semibold">
                    {referral.username}
                  </p>
                  {referral.joinedDate && (
                    <p className="text-[#BBBDC0] text-xs font-montserrat">
                      Присоединился {new Date(referral.joinedDate).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {/* 🎁 Показываем статус завершения визитов */}
                {referral.completedVisits !== undefined && referral.completedVisits > 0 ? (
                  <>
                    <p className="text-green-600 font-montserrat font-bold text-lg">
                      {referral.completedVisits}/1 ✓
                    </p>
                    <p className="text-green-500 text-xs font-montserrat">
                      Засчитан
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-500 font-montserrat font-bold text-lg">
                      0/1
                    </p>
                    <p className="text-yellow-400 text-xs font-montserrat">
                      Не ходил
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-montserrat font-semibold">
            Пока никого не пригласил
          </p>
          <p className="text-gray-500 text-sm font-montserrat mt-1">
            Поделись ссылкой с друзьями и получи бонусы
          </p>
        </div>
      )}
    </div>
  );
}