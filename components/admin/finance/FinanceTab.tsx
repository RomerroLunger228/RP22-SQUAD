/**
 * Основная вкладка финансов
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FinanceTimeFilter, { FinanceTimePeriod } from './FinanceTimeFilter';
import FinanceStatCards from './FinanceStatCards';
import { RevenueStats } from '@/lib/revenue-utils';
import { apiClient, createQueryKey } from '@/lib/axios';

interface FinanceTabProps {
  loading?: boolean;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ loading: externalLoading = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<FinanceTimePeriod>('month');

  // Карта периодов для API
  const periodMap = {
    'day': 'today',
    'week': 'week', 
    'month': 'month'
  } as const;

  // Загрузка статистики с React Query
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: createQueryKey('revenue-stats', { period: periodMap[selectedPeriod] }),
    queryFn: async (): Promise<RevenueStats> => {
      const response = await apiClient.get<RevenueStats>(`/api/revenue/stats?period=${periodMap[selectedPeriod]}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты
    retry: 2,
  });

  // Обработчик изменения периода
  const handlePeriodChange = (period: FinanceTimePeriod) => {
    setSelectedPeriod(period);
  };

  const loading = statsLoading || externalLoading;
  const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-400 font-montserrat mb-4">{errorMessage}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#111213] rounded-lg font-montserrat font-semibold transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-montserrat font-bold text-white mb-2">
          Финансы
        </h2>
        <p className="text-[#BBBDC0] font-montserrat text-sm">
          Детальная статистика доходов и заработка
        </p>
      </div>

      {/* Фильтр времени */}
      <div className="px-4">
        <FinanceTimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      {/* Статистические карточки */}
      <div className="px-4">
        {stats ? (
          <FinanceStatCards stats={stats} loading={loading} />
        ) : (
          <FinanceStatCards 
            stats={{
              servicesRevenue: 0,
              servicesPotentialRevenue: 0,
              servicesLoss: 0,
              subscriptionsRevenue: 0,
              totalRevenue: 0,
              netProfit: 0,
              totalAppointments: 0,
              freeAppointments: 0,
              discountedAppointments: 0,
              couponAppointments: 0,  // 🎁 Добавляем купоны
              regularAppointments: 0
            }} 
            loading={loading} 
          />
        )}
      </div>

      {/* Дополнительная информация */}
      {stats && !loading && (
        <div className="px-4">
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] font-montserrat font-semibold mb-3">
              Детализация
            </h3>
            <div className="space-y-2 text-sm font-montserrat">
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Всего записей:</span>
                <span className="text-white">{stats.totalAppointments}</span>
              </div>
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Бесплатных записей:</span>
                <span className="text-white">{stats.freeAppointments}</span>
              </div>
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Записей со скидкой:</span>
                <span className="text-white">{stats.discountedAppointments}</span>
              </div>
              {/* 🎁 Добавляем отображение купонов */}
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Записей по купонам:</span>
                <span className="text-yellow-400">{stats.couponAppointments} 🎁</span>
              </div>
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Обычных записей:</span>
                <span className="text-white">{stats.regularAppointments}</span>
              </div>
              <hr className="border-[#3A3A3A] my-2" />
              <div className="flex justify-between text-[#BBBDC0]">
                <span>Чистая прибыль:</span>
                <span className="text-[#D4AF37] font-semibold">
                  {stats.netProfit.toLocaleString()} PLN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTab;