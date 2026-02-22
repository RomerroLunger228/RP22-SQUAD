"use client";

// import { useEffect } from 'react';
import AdditionalInfo from "@/components/ui/AdditionalInfo";
import BookButton from "@/components/ui/BookButton";
import CardPointComponent from "@/components/ui/CardPointComponent";
import FireLoader from "@/components/ui/FireLoader";
import LastVisits from "@/components/ui/LastVisits";
import Navbar from "@/components/ui/Navbar";
import { useTelegramStore, selectDatabaseUser, selectIsLoading } from '@/lib/stores/telegramStore';


export default function Home() {
  const user = useTelegramStore(selectDatabaseUser);
  const isLoading = useTelegramStore(selectIsLoading);
  // const { syncUserData, isAuthenticated, lastSyncTime } = useTelegramStore();

  // Автоматическая синхронизация данных пользователя
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const now = Date.now();
  //     const syncThreshold = 5 * 60 * 1000; // 5 минут

  //     // Синхронизируем если данные старше 5 минут или нет данных
  //     if (!user || (now - lastSyncTime) > syncThreshold) {
  //       console.log('🔄 Auto-syncing user data...');
  //       syncUserData();
  //     }
  //   }
  // }, [isAuthenticated, user, lastSyncTime, syncUserData]);

  // Показываем загрузку если данные еще загружаются или нет пользователя
  if (isLoading || !user) {
    return <FireLoader />;
  }
  return (
    <div className="px-4 py-8 min-h-screen">
      <Navbar username={user.username} />
      <CardPointComponent userPoints={user.points || 0} />
      <AdditionalInfo/>
      <LastVisits />
      <BookButton />
    </div>
  );
}
