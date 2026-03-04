// ОБУЧАЮЩИЙ ПРИМЕР: Компонент кнопок действий для управления подпиской
// 
// ПРИНЦИП ЕДИНСТВЕННОЙ ОТВЕТСТВЕННОСТИ:
// Этот компонент отвечает ТОЛЬКО за кнопки действий с подпиской пользователя
// 
// ИЗВЛЕЧЕНО ИЗ: UserModal.tsx строки 391-421
// ОТВЕТСТВЕННОСТЬ: Кнопки удаления и добавления подписки с условной логикой

"use client";

import { Trash2, Loader2, Plus } from 'lucide-react';

// ТИПЫ ПОДПИСКИ - только необходимые поля
interface Subscription {
  id: number;
  status: string;
}

interface UserActionsProps {
  subscription: Subscription | null;
  isDeleting: boolean;
  onDeleteSubscription: () => void;
  onShowAddSubscription: () => void;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. УСЛОВНАЯ ЛОГИКА: Кнопки показываются в зависимости от состояния подписки
// 2. ИНТЕРАКТИВНЫЙ КОМПОНЕНТ: Обрабатывает действия пользователя
// 3. СОСТОЯНИЯ ЗАГРУЗКИ: Показывает разные состояния кнопок
// 4. ЧЕТКИЙ API: Получает только необходимые данные и колбеки

export function UserActions({
  subscription,
  isDeleting,
  onDeleteSubscription,
  onShowAddSubscription
}: UserActionsProps) {
  return (
    <div className="p-4 pb-24 border-t border-[#2A2A2A] flex-shrink-0 space-y-3">
      {/* КНОПКА УДАЛЕНИЯ ПОДПИСКИ - точно такая же логика (строки 392-410) */}
      {subscription && (subscription.status === 'active' || subscription.status === 'expired') && (
        <button
          onClick={onDeleteSubscription}
          disabled={isDeleting}
          className="w-full px-4 py-3 bg-gradient-to-r from-[#541c15] to-[#6B2319] hover:from-[#6B2319] hover:to-[#7D2A1C] text-red-100 font-montserrat font-medium rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Удаление...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              {subscription.status === 'expired' ? 'Удалить истекшую подписку' : 'Удалить подписку'}
            </>
          )}
        </button>
      )}

      {/* КНОПКА ДОБАВЛЕНИЯ/ПРОДЛЕНИЯ ПОДПИСКИ - точно такая же логика (строки 412-421) */}
      {(!subscription || subscription.status === 'expired') && (
        <button
          onClick={onShowAddSubscription}
          className="w-full px-4 py-3 bg-green-500/20 text-green-300 rounded-md font-montserrat font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {subscription && subscription.status === 'expired' ? 'Продлить подписку' : 'Добавить подписку'}
        </button>
      )}
    </div>
  );
}

// ОБУЧАЮЩИЕ ПРИНЦИПЫ ПРИМЕНЕНЫ:
// 
// 1. УСЛОВНАЯ ЛОГИКА: Сложная логика показа кнопок вынесена в отдельный компонент
// 2. ПРОБРОС ДЕЙСТВИЙ: Компонент не знает что происходит при клике, только вызывает колбеки
// 3. ТИПИЗАЦИЯ: Минимальные типы - только то что нужно для работы
// 4. СОХРАНЕНИЕ UX: Точно такие же стили, анимации и состояния
// 5. ЧИТАЕМОСТЬ: Понятно что это компонент для действий пользователя