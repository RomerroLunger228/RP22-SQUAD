"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import CardPointComponent from "@/components/ui/CardPointComponent";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ReferralLinkCard from "@/components/profile/ReferralLinkCard";
import ReferralStats from "@/components/profile/ReferralStats";
import ReferralsList from "@/components/profile/ReferralsList";
import SubscriptionCard from "@/components/profile/SubscriptionCard";
import { apiClient } from "@/lib/axios";
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';
import FireLoader from "@/components/ui/FireLoader";
import { useRouter } from "next/navigation";



export default function ProfilePage() {
  const router = useRouter();
  // Получаем текущего пользователя из Telegram store
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  const { isLoading: telegramLoading } = useTelegramStore();
  
  // Перенаправление админа через useEffect
  useEffect(() => {
    if (user?.role !== 'user' && user?.role) {
      router.replace('/admin');
    }
  }, [user?.role, router]);
  
  // Получаем реферальную ссылку через API
  const { data: referralData } = useQuery({
    queryKey: ['referral-link'],
    queryFn: async () => {
      const response = await apiClient.get('/api/telegram/referral-link');
      return response.data.data;
    },
    enabled: !!user && isAuthenticated,
    retry: false
  });

  const referralLink = referralData?.referralLink || "";

  // Получаем реальные рефералы через API
  const { data: referralsData } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const response = await apiClient.get('/api/telegram/referrals');
      return response.data.data;
    },
    enabled: !!user && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const referrals = referralsData?.referrals || [];
  const referralStats = referralsData?.stats;
  // 🎁 Новые данные для купонов
  const referralCompletedUnique = referralsData?.referralCompletedUnique || 0;
  const availableCoupons = referralsData?.availableCoupons || 0;
  

  // Показываем загрузчик если нет данных пользователя или идет загрузка
  if (telegramLoading || !isAuthenticated || !user) {
    return <FireLoader />;
  }

  return (
    <div className="min-h-screen bg-[#111213] px-4 py-8">
      
      {/* Header */}
      <ProfileHeader 
        username={user.username}
        userLogo={user.avatar_url}
      />

      {/* Points Card */}
      <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
        {/* <CardPoints /> */}
        <CardPointComponent userPoints={user.points || 0}/>
      </div>

      {/* Subscription Card */}
      <div className="mt-6 animate-slideUp" style={{ animationDelay: '0.15s' }}>
        <SubscriptionCard />
      </div>

      {/* Referral Section */}
      <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-xl font-montserrat font-semibold text-white mb-4">
          Реферальная программа
        </h2>
        
        {/* Referral Link Card */}
        <ReferralLinkCard referralLink={referralLink} />

        {/* Referral Stats */}
        <ReferralStats 
          referrals={referrals} 
          stats={referralStats} 
          referralCompletedUnique={referralCompletedUnique}
          availableCoupons={availableCoupons}
        />

        {/* Referrals List */}
        <ReferralsList referrals={referrals} />
      </div>
    </div>
  );
}