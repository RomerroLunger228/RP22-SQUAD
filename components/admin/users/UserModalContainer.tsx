// ОБУЧАЮЩИЙ ПРИМЕР: Контейнерный компонент (Container Pattern)
// 
// АРХИТЕКТУРНЫЙ ПАТТЕРН "КОНТЕЙНЕР":
// 1. ЛОГИКА: Содержит всю бизнес-логику через useUserModal хук
// 2. КОМПОЗИЦИЯ: Собирает маленькие компоненты в единое целое
// 3. ОРКЕСТРАЦИЯ: Координирует взаимодействие между компонентами
//
// РЕЗУЛЬТАТ РЕФАКТОРИНГА:
// 556 строк → 5 компонентов + 1 хук = Читаемый и поддерживаемый код

"use client";

import { X } from 'lucide-react';
import { User } from '@/types/admin';
import { useUserModal } from '@/hooks/useUserModal';
import { UserProfile } from './UserProfile';
import { UserSubscriptions } from './UserSubscriptions';
import { UserActions } from './UserActions';
import { SubscriptionPlanSelector } from './SubscriptionPlanSelector';

interface UserModalContainerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => Promise<void>;
}

// ОБУЧАЮЩИЕ ЗАМЕТКИ:
// 1. КОНТЕЙНЕР: Управляет данными и состоянием через хук
// 2. КОМПОЗИЦИЯ: Собирает специализированные компоненты
// 3. ДЕЛЕГИРОВАНИЕ: Передает данные и обработчики дочерним компонентам
// 4. СОХРАНЕНИЕ СТРУКТУРЫ: Точно такая же структура как в оригинале

export function UserModalContainer({ user, isOpen, onClose, onDataChange }: UserModalContainerProps) {
  // ВСЯ ЛОГИКА В ХУКЕ - контейнер остается чистым
  const {
    subscription,
    availablePlans,
    subscriptionLoading,
    plansLoading,
    showAddSubscription,
    handleDeleteSubscription,
    handleShowAddSubscription,
    handleCreateSubscription,
    handleCloseAddSubscription,
    isDeleting,
    isCreating,
  } = useUserModal(user, isOpen, onDataChange);

  // Если модалка закрыта или нет пользователя, ничего не рендерим
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-[#0F0F0F] w-full h-full flex flex-col">
        {/* HEADER - точно такой же как в оригинале (строки 188-199) */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] flex-shrink-0">
          <h2 className="text-white font-montserrat font-semibold text-lg">
            Информация о пользователе
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT - точно такая же структура (строки 201-388) */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* КОМПОНЕНТ 1: Профиль пользователя */}
          <UserProfile user={user} />

          {/* КОМПОНЕНТ 2: Управление подписками */}
          <UserSubscriptions 
            subscription={subscription ?? null}
            isLoading={subscriptionLoading}
          />
        </div>

        {/* FOOTER - точно такой же (строки 390-538) */}
        <UserActions
          subscription={subscription ?? null}
          isDeleting={isDeleting}
          onDeleteSubscription={handleDeleteSubscription}
          onShowAddSubscription={handleShowAddSubscription}
        />

        {/* ПОЛНОЭКРАННАЯ МОДАЛКА ВЫБОРА ПЛАНОВ */}
        <SubscriptionPlanSelector
          isOpen={showAddSubscription}
          onClose={handleCloseAddSubscription}
          availablePlans={availablePlans}
          isLoading={plansLoading}
          onSelectPlan={handleCreateSubscription}
          isCreating={isCreating}
          hasExpiredSubscription={subscription?.status === 'expired'}
        />
      </div>
    </div>
  );
}

// ОБУЧАЮЩИЕ ИТОГИ РЕФАКТОРИНГА:
// 
// ЧТО ДОСТИГНУТО:
// ✅ 556 строк разбиты на 5 переиспользуемых компонентов + 1 хук
// ✅ Каждый компонент имеет единственную ответственность
// ✅ Логика отделена от представления
// ✅ Компоненты можно переиспользовать в других админских интерфейсах
// ✅ Код стал читаемым и поддерживаемым
// ✅ Легко тестировать каждый компонент отдельно
//
// ЧТО НЕ СЛОМАЛОСЬ:
// ✅ Точно такой же UI и UX
// ✅ Все состояния обрабатываются корректно
// ✅ API компонента не изменился
// ✅ Производительность TanStack Query сохранена
//
// ПРИНЦИПЫ SOLID ПРИМЕНЕНЫ:
// S - Single Responsibility: Каждый компонент решает одну задачу
// O - Open/Closed: Компоненты можно расширять через props
// L - Liskov Substitution: Компоненты взаимозаменяемы
// I - Interface Segregation: Минимальные интерфейсы props
// D - Dependency Inversion: Зависимости инжектируются через props