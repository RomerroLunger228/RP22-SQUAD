/**
 * Карточки финансовой статистики
 * Показывают общий заработок, с подписок и с записей
 */

import React from 'react';
import { TrendingUp, Calendar, CreditCard, Gift } from 'lucide-react';
import { RevenueStats } from '@/lib/revenue-utils';

interface FinanceStatCardsProps {
  stats: RevenueStats;
  loading?: boolean;
}

interface FinanceStatCardProps {
  title: string;
  subtitle: string;
  value: number;
  currency?: string;
  icon: React.ReactNode;
  gradientColors: string;
}

const FinanceStatCard: React.FC<FinanceStatCardProps> = React.memo(({
  title,
  subtitle,
  value,
  currency = 'PLN',
  icon,
  gradientColors
}) => {
  const formatValue = (val: number) => {
    if (currency === 'PLN') {
      return `${val.toLocaleString()} PLN`;
    }
    return val.toLocaleString();
  };

  return (
    <div className={`
      bg-gradient-to-br ${gradientColors} rounded-[18px] p-4 relative overflow-hidden
      transform transition-transform duration-200 hover:scale-105 border border-[#D4AF37]/20
    `}>
      {/* Заголовок и иконка */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#D4AF37] font-montserrat text-sm font-semibold">
            {title}
          </h3>
          <p className="text-[#BBBDC0] font-montserrat text-xs font-normal">
            {subtitle}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <div className="text-[#D4AF37] [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        </div>
      </div>

      {/* Основная метрика */}
      <div className="text-2xl font-montserrat font-bold text-white">
        {formatValue(value)}
      </div>
    </div>
  );
});

FinanceStatCard.displayName = 'FinanceStatCard';

const FinanceStatCards: React.FC<FinanceStatCardsProps> = React.memo(({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, index) => (
          <div 
            key={index} 
            className="bg-[#1A1A1A] rounded-[18px] p-4 animate-pulse border border-[#D4AF37]/20"
          >
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Общий заработок */}
      <FinanceStatCard
        title="Общий заработок"
        subtitle="всего доходов"
        value={stats.totalRevenue}
        icon={<TrendingUp />}
        gradientColors="from-[#1A1A1A] to-[#2A2A2A]"
      />

      {/* Заработок с подписок */}
      <FinanceStatCard
        title="С подписок"
        subtitle="доход от подписок"
        value={stats.subscriptionsRevenue}
        icon={<CreditCard />}
        gradientColors="from-[#1A1A1A] to-[#2A2A2A]"
      />

      {/* Заработок с записей */}
      <FinanceStatCard
        title="С записей"
        subtitle="доход от услуг"
        value={stats.servicesRevenue}
        icon={<Calendar />}
        gradientColors="from-[#1A1A1A] to-[#2A2A2A]"
      />

      {/* 🎁 Статистика купонов */}
      <FinanceStatCard
        title="Купонов"
        subtitle="бесплатных записей"
        value={stats.couponAppointments}
        currency=""
        icon={<Gift />}
        gradientColors="from-yellow-600/20 to-orange-600/20"
      />
    </div>
  );
});

FinanceStatCards.displayName = 'FinanceStatCards';

export default FinanceStatCards;