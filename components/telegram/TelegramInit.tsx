'use client';

import { useEffect } from 'react';
import { useTelegramStore } from '@/lib/stores/telegramStore';
import FireLoader from '@/components/ui/FireLoader';

interface TelegramInitProps {
  children: React.ReactNode;
}

export function TelegramInit({ children }: TelegramInitProps) {
  const { initialize, isReady } = useTelegramStore();

  useEffect(() => {
    initialize();
    
    // Отключаем зум жестами
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, [initialize]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#111213] flex items-center justify-center">
        <FireLoader />
      </div>
    );
  }

  
  

  return (
    <div className="min-h-screen bg-[#111213]">
      {children}
    </div>
  );
}