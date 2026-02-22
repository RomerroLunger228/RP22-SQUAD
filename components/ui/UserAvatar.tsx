import React, { useMemo } from 'react';
import Image from 'next/image';
import { useTelegramStore } from '@/lib/stores/telegramStore';

interface UserAvatarProps {
  username: string;
  avatar_url?: string;
  photo_url?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  avatar_url,
  photo_url,
  size = 'medium',
  className = ''
}) => {
  const { databaseUser } = useTelegramStore();

  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  const sizeValues = {
    small: 32,
    medium: 40,
    large: 48
  };

  const finalAvatarUrl = useMemo(() => {
    // Приоритет: avatar_url > photo_url > fallback к Telegram Store
    if (avatar_url) {
      return avatar_url;
    } else if (photo_url) {
      return photo_url;
    } else {
      // Fallback к данным из Telegram Store если это текущий пользователь
      if (databaseUser && databaseUser.username === username && databaseUser.avatar_url) {
        return databaseUser.avatar_url;
      } else {
        return null;
      }
    }
  }, [avatar_url, photo_url, username, databaseUser]);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-montserrat font-semibold flex-shrink-0 overflow-hidden ${className}`}
      style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
    >
      {finalAvatarUrl ? (
        <Image 
          src={finalAvatarUrl} 
          alt={username}
          width={sizeValues[size]}
          height={sizeValues[size]}
          className="w-full h-full object-cover"
        />
      ) : (
        username.charAt(0).toUpperCase()
      )}
    </div>
  );
};

export default UserAvatar;