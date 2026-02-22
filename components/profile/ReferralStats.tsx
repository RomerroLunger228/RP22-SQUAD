"use client";

interface Referral {
  id: number;
  username: string;
  points: number;
  joinedDate: string;
}

interface ReferralStatsProps {
  referrals: Referral[];
  stats?: {
    totalReferrals: number;
    totalPointsEarned: number;
    currentMonthReferrals: number;
  };
  // 🎁 Новые поля для купонов
  referralCompletedUnique?: number;
  availableCoupons?: number;
}

export default function ReferralStats({ referrals, stats, referralCompletedUnique = 0, availableCoupons = 0 }: ReferralStatsProps) {
  // Используем статистику с API если есть, иначе считаем из массива рефералов
  const totalReferrals = stats?.totalReferrals ?? referrals.length;
  const totalBonuses = stats?.totalPointsEarned ?? referrals.reduce((sum, ref) => sum + ref.points, 0);

  // 🎁 Расчет прогресса до следующего купона
  const progressToNextCoupon = referralCompletedUnique % 5;
  const needMoreReferrals = 5 - progressToNextCoupon;

  return (
    <div className="space-y-4 mb-6">
      {/* Существующие карточки */}
      <div className="grid grid-cols-2 gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
        <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-xl p-4 shadow-md">
          <p className="text-[#FFFFFF] text-sm font-montserrat font-medium mb-1">
            Приглашено друзей
          </p>
          <p className="text-3xl font-montserrat font-bold text-white">
            {totalReferrals}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-800 to-gray-800 border border-green-800 rounded-xl p-4 shadow-md">
          <p className="text-white text-sm font-montserrat font-medium mb-1">
            Заработано бонусов
          </p>
          <p className="text-3xl font-montserrat font-bold text-white">
            {totalBonuses}
          </p>
        </div>
      </div>

      {/* 🎁 Новая секция с купонами и прогрессом */}
      <div className="grid grid-cols-1 gap-4 animate-slideUp" style={{ animationDelay: '0.4s' }}>
        {/* Доступные купоны */}
        <div className="bg-gradient-to-br from-yellow-600 to-orange-600 border border-yellow-500 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-montserrat font-medium mb-1">
                🎁 Бесплатных услуг
              </p>
              <p className="text-3xl font-montserrat font-bold text-white">
                {availableCoupons}
              </p>
            </div>
          </div>
        </div>

        {/* Прогресс до следующего купона */}
        <div className="bg-[#1A1B1C] border border-[#2A2A2A] rounded-xl p-4 shadow-md">
          <p className="text-[#FFFFFF] text-sm font-montserrat font-medium mb-3">
            Прогресс до бесплатной услуги
          </p>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-montserrat font-bold text-lg">
              {progressToNextCoupon} / 5
            </span>
            <span className="text-[#BBBDC0] text-sm font-montserrat">
              {needMoreReferrals === 5 
                ? "Пригласи 5 друзей" 
                : `Осталось ${needMoreReferrals}`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#2A2A2A] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progressToNextCoupon / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}