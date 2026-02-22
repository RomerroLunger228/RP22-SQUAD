"use client";

import { useState } from "react";

import ProfileAvatar from "../../components/ui/ProfileAvatar";
import ProfileInfo from "../../components/ui/ProfileInfo";
import ProfileTabs from "../../components/ui/ProfileTabs";
import PhotoGrid from "../../components/ui/PhotoGrid";
import { ProfileButton } from "@/components/ui/BookButton";
import CommentsSection from "../../components/ui/CommentsSection";
import FireLoader from "../../components/ui/FireLoader";
import MapGoogle from "@/components/ui/Map";
import { useTelegramStore, selectDatabaseUser, selectIsAuthenticated } from '@/lib/stores/telegramStore';

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState<'grid' | 'comments'>('grid');
  
  // Получаем данные пользователя из Telegram store
  const user = useTelegramStore(selectDatabaseUser);
  const isAuthenticated = useTelegramStore(selectIsAuthenticated);
  const { isLoading: telegramLoading } = useTelegramStore();
  
  // Показываем loader если данные пользователя еще загружаются
  const userLoading = telegramLoading || !isAuthenticated || !user;

  // Показываем FireLoader пока все загружается
  if (userLoading) {
    return <FireLoader text="Loading RP22..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      
      <div className="px-4 pb-6 pt-8 space-y-6">
        <ProfileAvatar />
        <ProfileInfo 
          name="RP22"
          description="RP BARBER PL | ENG | UK | RU"
        />
        {/* <ProfileActions /> */}
        <MapGoogle />
        <ProfileButton />
        {/* <ProfileHighlights /> */}
      </div>

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'grid' ? <PhotoGrid /> : (
        <CommentsSection 
          currentUser={user ? {
            id: user.id,
            username: user.username,
            avatar: user.avatar_url
          } : undefined}
        />
      )}
    </div>
  );
}