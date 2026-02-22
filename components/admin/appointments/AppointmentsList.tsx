/**
 * Список записей для админки
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение списка всех записей с фильтрацией
 * - Возможность изменения статуса записей
 * - Фильтрация по периодам времени
 * - Краткая статистика по категориям
 */

import React from 'react';
import { Appointment, FilterPeriodType, CategoryStats } from '@/types/admin';
import { formatDate, formatTime, getStatusInfo, formatCurrency } from '@/utils/admin/formatting';
import { PERIOD_FILTER_OPTIONS, CATEGORY_GRADIENTS } from '@/utils/admin/constants';
import ActionMenu, { ActionMenuItem } from '@/components/ui/ActionMenu';

interface AppointmentsListProps {
  appointments: Appointment[];
  categoryStats: CategoryStats[];
  timePeriodFilter: FilterPeriodType;
  onPeriodFilterChange: (period: FilterPeriodType) => void;
  onStatusUpdate: (appointmentId: number, newStatus: string) => void;
  loading?: boolean;
}

/**
 * Компонент карточки записи
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Информация о услуге и времени
 * - Текущий статус с цветовым кодированием
 * - Кнопки действий для изменения статуса
 * - Адаптивная верстка
 */
interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (appointmentId: number, newStatus: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = React.memo(({
  appointment,
  onStatusUpdate
}) => {
  const statusInfo = getStatusInfo(appointment.status);

  // Создаем список действий для меню
  const getMenuActions = (): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [];

    if (appointment.status === 'pending') {
      actions.push(
        {
          id: 'confirm',
          label: 'Подтвердить',
          onClick: () => onStatusUpdate(appointment.id, 'confirmed'),
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        },
        {
          id: 'cancel',
          label: 'Отменить',
          onClick: () => onStatusUpdate(appointment.id, 'canceled'),
          variant: 'danger',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        }
      );
    } else if (appointment.status === 'confirmed') {
      actions.push(
        {
          id: 'complete',
          label: 'Завершить',
          onClick: () => onStatusUpdate(appointment.id, 'completed'),
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'no-show',
          label: 'Неявка',
          onClick: () => onStatusUpdate(appointment.id, 'no_show'),
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          )
        },
        {
          id: 'force-cancel',
          label: 'Отменить принудительно',
          onClick: () => onStatusUpdate(appointment.id, 'canceled'),
          variant: 'danger',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          )
        }
      );
    } else if (appointment.status === 'canceled') {
      // Для отмененных записей - возможность восстановления
      actions.push({
        id: 'restore',
        label: 'Восстановить',
        onClick: () => onStatusUpdate(appointment.id, 'confirmed'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      });
    } else {
      // Для остальных статусов только принудительная отмена
      actions.push({
        id: 'force-cancel',
        label: 'Отменить принудительно',
        onClick: () => onStatusUpdate(appointment.id, 'canceled'),
        variant: 'danger',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      });
    }

    return actions;
  };

  return (
    <div className="bg-[#1A1A1A] rounded-[12px] p-4 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          {/* Название услуги */}
          <h3 className="text-white text-base font-montserrat font-semibold mb-2 line-clamp-2">
            {appointment.service.name}
          </h3>
          
          {/* Детали записи */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#BBBDC0] text-sm font-montserrat">
              <span>{formatDate(appointment.appointment_date)}</span>
              <span>{formatTime(appointment.time)}</span>
            </div>
            <div className="flex items-center gap-2 text-[#BBBDC0] text-sm font-montserrat">
              <span>{formatCurrency(appointment.final_price_charged || appointment.service.pl_price)}</span>
              
              {/* 🎁 Показываем если оплачено купоном */}
              {appointment.payment_method === 'coupon' && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-md">
                  🎁 Купон
                </span>
              )}
              
              {/* Показываем льготы подписки */}
              {appointment.subscription_benefit_type && appointment.payment_method !== 'coupon' && (
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-md">
                  {appointment.subscription_benefit_type === 'free' ? 'Бесплатно' : 'Скидка'}
                </span>
              )}
              
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md">
                {appointment.category.name}
              </span>
            </div>
          </div>
        </div>
        
        {/* Меню действий в правом верхнем углу */}
        <ActionMenu items={getMenuActions()} />
      </div>
      
      {/* Статус в отдельной строке внизу */}
      <div className="flex justify-end mt-3 pt-3 border-t border-[#2A2A2A]">
        <div className={`px-2 py-1 rounded-lg ${statusInfo.color} shadow-sm`}>
          <span className={`text-xs font-montserrat font-bold ${statusInfo.textColor} uppercase tracking-tight whitespace-nowrap drop-shadow-sm`} style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)' }}>
            {statusInfo.text}
          </span>
        </div>
      </div>
    </div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

/**
 * Компонент краткой статистики по категориям
 * 
 * ЛОГИКА: Показывает сводку категорий для быстрого обзора
 */
const CategorySummary: React.FC<{ categoryStats: CategoryStats[] }> = React.memo(({ categoryStats }) => {
  if (categoryStats.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {categoryStats.map((category, index) => {
        const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
        
        return (
          <div 
            key={category.id} 
            className={`bg-gradient-to-br ${gradient.background} rounded-xl p-3 border border-white/10`}
          >
            <div className="text-center">
              <h4 className={`${gradient.text} text-xs font-medium mb-1`}>
                {category.name}
              </h4>
              <div className="text-xl font-outfit font-bold text-white mb-1">
                {category.count}
              </div>
              <p className="text-white/60 text-xs">записей</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

CategorySummary.displayName = 'CategorySummary';

/**
 * Основной компонент списка записей
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Заголовок с фильтром периодов
 * - Краткая статистика по категориям
 * - Список записей или пустое состояние
 * - Загрузочные состояния
 */
const AppointmentsList: React.FC<AppointmentsListProps> = React.memo(({
  appointments,
  categoryStats,
  timePeriodFilter,
  onPeriodFilterChange,
  onStatusUpdate,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-montserrat font-semibold text-white">
            Управление записями
          </h2>
          <div className="w-48 h-10 bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
        
        {/* Загрузочные карточки категорий */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-700 rounded-xl p-3 animate-pulse">
              <div className="h-16"></div>
            </div>
          ))}
        </div>
        
        {/* Загрузочные карточки записей */}
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-700 rounded-[12px] p-4 animate-pulse">
              <div className="h-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и фильтр */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-montserrat font-semibold text-white">
          Управление записями
        </h2>
        
        <div className="flex items-center gap-3">
          <select
            value={timePeriodFilter}
            onChange={(e) => onPeriodFilterChange(e.target.value as FilterPeriodType)}
            className="px-3 py-2 bg-[#2A2A2A] border border-[#333333] rounded-lg text-white font-montserrat text-sm focus:outline-none focus:border-[#4F8A3E] transition-colors"
          >
            {PERIOD_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Краткая статистика по категориям */}
      <CategorySummary categoryStats={categoryStats} />

      {/* Список записей */}
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#BBBDC0] text-lg font-montserrat">
            {timePeriodFilter === 'all' ? 'Записей пока нет' : 'Нет записей для выбранного периода'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusUpdate={onStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
});

AppointmentsList.displayName = 'AppointmentsList';

export default AppointmentsList;