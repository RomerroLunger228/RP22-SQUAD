/**
 * Рефакторенная админская страница
 * 
 * ЛОГИКА РЕФАКТОРИНГА:
 * - Разделение на модули: типы, утилиты, хуки, компоненты
 * - Использование кастомных хуков для управления состоянием
 * - Модульные компоненты вместо монолитного JSX
 * - Централизованная обработка данных
 * - Мемоизация для производительности
 * 
 * АРХИТЕКТУРА:
 * 1. Хуки управляют всем состоянием и бизнес-логикой
 * 2. Компоненты только отображают данные
 * 3. Утилиты содержат чистые функции
 * 4. Типы обеспечивают безопасность
 * 
 * ПРЕИМУЩЕСТВА:
 * - Читаемость: каждый модуль < 400 строк
 * - Переиспользование: компоненты можно использовать отдельно
 * - Тестируемость: каждую часть можно тестировать изолированно
 * - Производительность: React.memo + useMemo
 * - Масштабируемость: легко добавлять новые фичи
 */

"use client";
import { Calendar as CalendarComponent } from '@/components/ui/calendar/Calendar';

// Компоненты UI
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import StatCards from '@/components/admin/dashboard/StatCards';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import StatusStats from '@/components/admin/dashboard/StatusStats';
import CategoryStats from '@/components/admin/dashboard/CategoryStats';
import CommentsList from '@/components/admin/comments/CommentsList';
import UsersList from '@/components/admin/users/UsersList';
import AppointmentsList from '@/components/admin/appointments/AppointmentsList';
import FinanceTab from '@/components/admin/finance/FinanceTab';
import { WorkingCalendar } from '@/components/admin/working-hours/WorkingCalendar';
// import WorkingHoursTab from '@/components/admin/working-hours/WorkingHoursTab'; // Временно отключено

// Хуки
import { useAdminData } from '@/hooks/admin/useAdminData';
import { useAdminFilters } from '@/hooks/admin/useAdminFilters';
import { useAdminUI } from '@/hooks/admin/useAdminUI';

// Типы
import { TabType } from '@/types/admin';
import AdminRandomizer from '@/components/admin/AdminRandomizer';

/**
 * Главный компонент админки
 * 
 * ЛОГИКА АРХИТЕКТУРЫ:
 * - Три основных хука управляют всем состоянием
 * - Условный рендеринг компонентов по активному табу
 * - Передача только необходимых пропсов каждому компоненту
 * - Обработка состояний загрузки централизованно
 */
export default function AdminPage() {
  // === ХУКИ СОСТОЯНИЯ ===
  
  /**
   * Хук данных - управляет загрузкой и изменением данных
   * ЛОГИКА: Централизованное управление всеми данными админки
   */
  const {
    appointments,
    users,
    comments,
    stats,
    loading,
    error,
    updateAppointmentStatus,
    deleteComment,
    refreshUsers,
  } = useAdminData();

  /**
   * Хук фильтров - управляет фильтрацией и статистикой
   * ЛОГИКА: Реактивные вычисления на основе данных и фильтров
   */
  const {
    timePeriodFilter,
    chartPeriodFilter,
    setTimePeriodFilter,
    setChartPeriodFilter,
    statusStats,
    categoryStats,
    revenueData,
  } = useAdminFilters(appointments);

  /**
   * Хук UI - управляет состояниями интерфейса
   * ЛОГИКА: Все UI состояния (табы, формы, модалки) в одном месте
   */
  const {
    activeTab,
    setActiveTab,
  } = useAdminUI();

  // === ОБРАБОТЧИКИ СОБЫТИЙ ===

  // === СОСТОЯНИЯ ЗАГРУЗКИ И ОШИБОК ===

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111213] text-white px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#BBBDC0] font-montserrat">Загрузка админки...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111213] text-white px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 font-montserrat mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4F8A3E] hover:bg-[#5A9449] text-white rounded-lg font-montserrat transition-colors"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === ОСНОВНОЙ РЕНДЕР ===

  return (
    <div className="min-h-screen bg-[#111213] text-white">
      {/* Заголовок */}
      <AdminHeader />

      {/* Навигационные табы */}
      <AdminTabs 
        activeTab={activeTab} 
        onTabChange={(tab: TabType) => setActiveTab(tab)} 
      />

      {/* Основной контент */}
      <div className="px-4 pb-28">
        {/* === ДАШБОРД === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Карточки статистики */}
            <StatCards stats={stats} loading={loading} onTabChange={setActiveTab} />
            
            {/* График доходов */}
            <RevenueChart
              data={revenueData}
              selectedPeriod={chartPeriodFilter}
              onPeriodChange={setChartPeriodFilter}
              loading={loading}
            />
            
            {/* Статистика по категориям */}
            <CategoryStats
              categoryStats={categoryStats}
              timePeriodFilter={timePeriodFilter}
              onPeriodFilterChange={setTimePeriodFilter}
              loading={loading}
            />
            
            {/* Статистика по статусам */}
            <StatusStats
              statusStats={statusStats}
              loading={loading}
            />
          </div>
        )}

        {/* === КАЛЕНДАРЬ === */}
        {activeTab === 'calendar' && (
          <CalendarComponent 
            onStatusUpdate={updateAppointmentStatus}
          />
        )}

        {/* === ЧАСЫ РАБОТЫ === */}
        {activeTab === 'working-hours' && (
          <WorkingCalendar />
        )}

        {/* === ЗАПИСИ === */}
        {activeTab === 'appointments' && (
          <AppointmentsList
            appointments={appointments}
            categoryStats={categoryStats}
            timePeriodFilter={timePeriodFilter}
            onPeriodFilterChange={setTimePeriodFilter}
            onStatusUpdate={updateAppointmentStatus}
            loading={loading}
          />
        )}

        {/* === ПОЛЬЗОВАТЕЛИ === */}
        {activeTab === 'users' && (
          <UsersList
            users={users}
            loading={loading}
            onDataChange={refreshUsers}
          />
        )}

        {/* === КОММЕНТАРИИ === */}
        {activeTab === 'comments' && (
          <CommentsList
            comments={comments}
            onDeleteComment={deleteComment}
            loading={loading}
          />
        )}

        {/* === РАНДОМАЙЗЕР === */}
        {activeTab === 'randomizer' && (
          <div className="space-y-2">
            <h2 className="text-xl font-montserrat font-semibold text-white text-center">
              Рандомайзер пользователей
            </h2>
            
            <AdminRandomizer users={users} />
          </div>
        )}

        {/* === ФИНАНСЫ === */}
        {activeTab === 'finance' && (
          <FinanceTab loading={loading} />
        )}
      </div>
    </div>
  );
}