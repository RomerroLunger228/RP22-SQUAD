// ОБУЧАЮЩИЙ ПРИМЕР: Презентационный компонент профиля пользователя
// 
// ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Этот компонент отвечает ТОЛЬКО за отображение данных профиля пользователя
// 
// ИЗВЛЕЧЕНО ИЗ: UserModal.tsx строки 203-251
// ОТВЕТСТВЕННОСТЬ: Отображение аватара, имени, поинтов, роли, даты регистрации

"use client";

import { Calendar } from 'lucide-react';
import { User } from '@/types/admin';
import UserAvatar from '@/components/ui/UserAvatar';

interface UserProfileProps {
  user: User;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. ЧИСТЫЙ КОМПОНЕНТ: Получает данные через props, не имеет собственного состояния
// 2. ПЕРЕИСПОЛЬЗУЕМОСТЬ: Можно использовать в любом месте где нужно показать профиль
// 3. ПРЕЗЕНТАЦИОННЫЙ КОМПОНЕНТ: Только UI, никакой бизнес-логики
// 4. СТРОГАЯ ТИПИЗАЦИЯ: TypeScript обеспечивает безопасность

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="space-y-4">
      {/* АВАТАР И ИМЯ - точно такая же разметка как в оригинале (строки 204-216) */}
      <div className="flex flex-row items-center justify-start gap-2 bg-black/60 rounded-lg p-3">
        <UserAvatar
          username={user.username}
          avatar_url={user.avatar_url}
          photo_url={user.photo_url}
          size="large"
          className="w-20 h-20 text-2xl bg-gray-600"
        />
        <div>
          <h3 className="text-xl font-bold text-white font-montserrat">
            @{user.username}
          </h3>
          <p className="text-[#BBBDC0] text-sm">ID: {user.id}</p>
        </div>
      </div>

      {/* ОСНОВНЫЕ ДАННЫЕ В КАРТОЧКАХ - точно такая же разметка (строки 219-235) */}
      <div className="">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center gap-1 bg-black/60 rounded-lg p-2">
            <div className="text-lg font-bold text-white ">
              {user.points !== null && user.points !== undefined ? user.points.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-gray-400 ">Поинты</div>
          </div>

          <div className="flex flex-col items-center gap-1 bg-black/60 rounded-lg p-2">
            <div className="text-lg font-bold text-white ">
              {user.role && user.role !== 'user' ? user.role : 'USER'}
            </div>
            <div className="text-xs text-gray-400 ">Роль</div>
          </div>
        </div>
      </div>

      {/* ДАТА РЕГИСТРАЦИИ - точно такая же разметка (строки 238-251) */}
      {user.created_at && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-black/20 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-300 text-sm">
              Зарегистрирован {new Date(user.created_at).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. КОМПОЗИЦИЯ: Компонент можно легко вставить в любую модалку или страницу
// 2. ЕДИНСТВЕННАЯ ОТВЕТСТВЕННОСТЬ: Только отображение профиля пользователя  
// 3. ИММУТАБЕЛЬНОСТЬ: Не изменяет переданные данные
// 4. ТИПИЗАЦИЯ: TypeScript типы для безопасности
// 5. ЧИТАЕМОСТЬ: Понятно что делает по названию и структуре
// 6. СОХРАНЕНИЕ UX: Точно такие же стили и форматирование как в оригинале