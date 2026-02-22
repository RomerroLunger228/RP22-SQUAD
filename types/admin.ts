/**
 * Типы и интерфейсы для админ-панели
 * 
 * ЛОГИКА СТРУКТУРЫ:
 * 1. Базовые сущности (Appointment, User, Comment, BlockedTime) - отражают структуру БД
 * 2. Статистика (AdminStats, StatusStats, CategoryStats) - агрегированные данные для аналитики
 * 3. UI состояния (TabType, FilterType, ValidationErrors) - управление интерфейсом
 * 4. Периоды (PeriodType) - для фильтрации по времени
 */

// === БАЗОВЫЕ СУЩНОСТИ ===

/**
 * Интерфейс записи на услугу
 * 
 * ЛОГИКА: Центральная сущность админки - все операции крутятся вокруг записей
 * - id: уникальный идентификатор записи
 * - appointment_date: дата в формате ISO (YYYY-MM-DD)
 * - time: время в формате HH:MM:SS или HH:MM
 * - status: текущее состояние записи (lifecycle)
 * - service: вложенный объект с информацией об услуге (денормализация для производительности)
 * - category: категория услуги (для группировки и аналитики)
 * - created_at: дата создания (для трекинга роста)
 */
export interface Appointment {
  id: number;
  appointment_date: string; // ISO date string (YYYY-MM-DD)
  time: string; // HH:MM:SS or HH:MM
  status: AppointmentStatus;
  service: {
    name: string;
    duration_minutes: number;
    pl_price: number; // цена в польских злотых
  };
  category: {
    id: number;
    name: string;
  };
  created_at: string; // ISO datetime string
  // Поля подписки
  subscription_benefit_type?: 'free' | 'discount' | 'coupon' | null;
  original_service_price?: number;
  discount_amount?: number;
  final_price_charged?: number; // Фактическая сумма к доплате
  // 🎁 Поле способа оплаты
  payment_method?: string | null;
  coupon_id?: number | null;
}

/**
 * Возможные статусы записи
 * 
 * ЛОГИКА ЖИЗНЕННОГО ЦИКЛА:
 * pending -> confirmed -> completed (happy path)
 * pending -> canceled (отмена)
 * confirmed -> no_show (клиент не пришел)
 * confirmed -> canceled (отмена после подтверждения)
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'canceled' | 'no_show';

/**
 * Пользователь системы
 * 
 * ЛОГИКА: Упрощенная модель пользователя для админки
 * - points: баллы лояльности (может быть null если система не использует)
 * - role: роль в системе (для разграничения доступов)
 * - subscription: флаг активной подписки
 */
export interface User {
  id: number;
  username: string;
  points?: number | null;
  role?: string;
  created_at?: string;
  subscription?: boolean; // true если есть активная подписка
  subscriptionTier?: string | null; // Название тира для фильтрации и отображения
  photo_url?: string; // URL аватарки пользователя из Telegram
  avatar_url?: string; // URL аватара пользователя из Telegram Store
}

/**
 * Комментарий/отзыв
 * 
 * ЛОГИКА: Простая структура для отзывов клиентов
 * - username: имя автора (денормализация для производительности)
 */
export interface Comment {
  id: number;
  content: string;
  username: string;
  created_at?: string;
  avatar_url?: string; // URL аватара пользователя из Telegram Store
}

/**
 * Заблокированное время
 * 
 * ЛОГИКА: Позволяет админу блокировать временные слоты когда он недоступен
 * - date: конкретная дата блокировки (может быть null для регулярных блокировок)
 * - start_time/end_time: временные границы блокировки
 * - reason: причина блокировки для удобства управления
 */
export interface BlockedTime {
  id: number;
  date: string | null; // может быть null для повторяющихся блокировок
  start_time: string | null; // HH:MM format
  end_time: string | null; // HH:MM format
  reason: string | null;
}

// === СТАТИСТИЧЕСКИЕ ДАННЫЕ ===

/**
 * Основная статистика админки
 * 
 * ЛОГИКА МЕТРИК:
 * - Абсолютные числа (total*) - общие показатели
 * - Месячные показатели (*ThisMonth) - текущая динамика
 * - Процентные изменения (*PercentChange) - тренды для принятия решений
 * - Доход (monthlyRevenue) - финансовые показатели
 * - Статусы (*ThisMonth) - операционные метрики
 */
export interface AdminStats {
  // Общие показатели
  totalAppointments: number;
  totalUsers: number;
  
  // Месячная динамика
  appointmentsThisMonth: number;
  usersThisMonth: number;
  appointmentsPercentChange: number; // % изменение относительно прошлого месяца
  usersPercentChange: number;
  
  // Финансовые показатели
  monthlyRevenue: number; // доход с завершенных записей в этом месяце
  
  // Статистика по статусам (текущий месяц)
  pendingThisMonth: number; // требуют внимания
  noShowThisMonth: number; // потерянный доход
  canceledThisMonth: number; // отмененные записи
}

/**
 * Статистика по статусам для определенного периода
 * 
 * ЛОГИКА: Помогает понять операционную эффективность
 * - pending: записи ждущие подтверждения (workload админа)
 * - confirmed: подтвержденные записи (будущий доход)
 * - completed: завершенные записи (реализованный доход)
 * - canceled/no_show: проблемные случаи (анализ потерь)
 */
export interface StatusStats {
  pending: number;
  confirmed: number;
  completed: number;
  canceled: number;
  no_show: number;
}

/**
 * Статистика по категории услуг
 * 
 * ЛОГИКА: Показывает популярность и доходность разных категорий услуг
 * - count: общее количество записей в категории
 * - статусы: распределение по статусам
 * - revenue: доход только с completed записей
 */
export interface CategoryStats {
  id: number;
  name: string;
  count: number;
  pending: number;
  confirmed: number;
  completed: number;
  canceled: number;
  no_show: number;
  revenue: number; // доход с завершенных услуг
}

// === UI СОСТОЯНИЯ И ФИЛЬТРЫ ===

/**
 * Типы табов в админке
 * 
 * ЛОГИКА НАВИГАЦИИ:
 * - dashboard: обзор и аналитика (главная страница)
 * - calendar: календарное представление записей
 * - appointments: детальное управление записями
 * - comments: модерация отзывов
 * - users: управление пользователями
 * - blocked-times: управление недоступным временем
 */
export type TabType = 'dashboard' | 'calendar' | 'working-hours' | 'appointments' | 'users' | 'comments' | 'randomizer' | 'finance';

/**
 * Объединенные типы фильтрации для записей
 * 
 * ЛОГИКА ФИЛЬТРАЦИИ:
 * Временные фильтры:
 * - all: все данные (без фильтра)
 * - day: только сегодня (оперативное управление)
 * - week: последние 7 дней (недельный обзор)
 * - month: текущий месяц (месячная отчетность)
 * - upcoming: будущие записи (планирование)
 * 
 * Статусные фильтры:
 * - confirmed: подтвержденные записи  
 * - completed: завершенные записи
 * - canceled: отмененные записи
 * - no_show: неявка клиента
 */
export type FilterPeriodType = 'day' | 'week' | 'month' | 'all' | 'upcoming' | 'confirmed' | 'completed' | 'canceled' | 'no_show';

/**
 * Типы периодов для графика доходов
 * 
 * ЛОГИКА АНАЛИТИКИ:
 * - 7days: детальный обзор (по дням)
 * - 30days: средний обзор (по неделям)
 * - 3months: долгосрочный тренд (по месяцам)
 */
export type ChartPeriodType = '3months' | '30days' | '7days';

/**
 * Данные для графика доходов
 * 
 * ЛОГИКА ВИЗУАЛИЗАЦИИ:
 * - month: отображаемый лейбл (Jan, Week 1, Mon и т.д.)
 * - amount: сумма дохода за период
 * - fullDate: полная дата для тултипа
 */
export interface RevenueChartData {
  month: string; // отображаемый лейбл
  amount: number; // доход за период
  fullDate: string; // полная дата для tooltip
}

/**
 * Ошибки валидации формы заблокированного времени
 * 
 * ЛОГИКА ВАЛИДАЦИИ:
 * - Поля проверяются индивидуально
 * - timeRange проверяет логическую связность времени начала и конца
 * - Все поля опциональны (ошибка появляется только если есть проблема)
 */
export interface BlockedTimeValidationErrors {
  date?: string;
  start_time?: string;
  end_time?: string;
  timeRange?: string; // ошибка связности времени начала/конца
}

/**
 * Форма нового заблокированного времени
 * 
 * ЛОГИКА ФОРМЫ:
 * - Все поля строки для простоты работы с HTML inputs
 * - date: в формате YYYY-MM-DD (HTML date input)
 * - время: в формате HH:MM (HTML time input)
 * - reason: произвольный текст для заметок
 */
export interface NewBlockedTimeForm {
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  reason: string;
}

/**
 * Форма рабочего дня
 */
export interface WorkingDayForm {
  weekday: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

/**
 * Ошибки валидации рабочего дня
 */
export interface WorkingDayValidationErrors {
  start_time?: string;
  end_time?: string;
  timeRange?: string;
}

/**
 * Информация о статусе (для отображения)
 * 
 * ЛОГИКА UI:
 * - text: человекочитаемый текст статуса
 * - color: CSS классы для цвета фона
 * - textColor: CSS классы для цвета текста
 * Разделение цветов позволяет гибко настраивать контрастность
 */
export interface StatusInfo {
  text: string;
  color: string; // CSS classes for background
  textColor: string; // CSS classes for text color
}

// === КОНСТАНТЫ ===

/**
 * Конфигурация табов
 * 
 * ЛОГИКА: Централизованная конфигурация для консистентности UI
 * - id соответствует TabType
 * - label: отображаемое название
 * - icon: иконка из lucide-react
 */
export interface TabConfig {
  id: TabType;
  label: string;
  icon: string; // название иконки из lucide-react
}

/**
 * Градиенты для категорий
 * 
 * ЛОГИКА: Предопределенные цветовые схемы для визуального разделения категорий
 * - используется цикличный доступ через модуль (index % gradients.length)
 */
export interface CategoryGradient {
  background: string; // CSS classes для фона
  text: string; // CSS classes для текста
  icon: string; // CSS classes для иконки
}