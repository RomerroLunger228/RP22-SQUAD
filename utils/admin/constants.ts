/**
 * Константы и конфигурация админки
 * 
 * ЛОГИКА ЦЕНТРАЛИЗАЦИИ:
 * - Все UI константы в одном месте
 * - Легко изменить цветовую схему
 * - Консистентность между компонентами
 * - Типизированные конфигурации
 */

import { Calendar, CalendarRange, Users, MessageSquare, Clock, DollarSign, Dices, BookOpen } from "lucide-react";
import { TabConfig, CategoryGradient } from '../../types/admin';

/**
 * Конфигурация табов навигации
 * 
 * ЛОГИКА ПОРЯДКА:
 * 1. dashboard - главная (обзор и аналитика)
 * 2. calendar - календарное представление (визуальное планирование)
 * 3. working-hours - часы работы (настройки расписания)
 * 4. users - управление пользователями (административная задача)
 * 5. comments - модерация (периодическая задача)
 * 6. randomizer - рандомайзер
 * 7. finance - финансы
 */
export const TAB_CONFIGS: TabConfig[] = [
  { 
    id: 'dashboard', 
    label: 'Дашборд', 
    icon: 'Calendar' // Calendar как символ обзора
  },
  { 
    id: 'calendar', 
    label: 'Календарь', 
    icon: 'CalendarRange' // CalendarRange для календарного вида
  },
  { 
    id: 'working-hours', 
    label: 'Часы работы', 
    icon: 'Clock'
  },
  { 
    id: 'appointments', 
    label: 'Записи', 
    icon: 'BookOpen'
  },
  { 
    id: 'users', 
    label: 'Пользователи', 
    icon: 'Users' // Users для пользователей
  },
  { 
    id: 'comments', 
    label: 'Комментарии', 
    icon: 'MessageSquare' // MessageSquare для комментариев
  },
  {
    id: 'randomizer',
    label: 'Рандомайзер',
    icon: 'Dices'
  },
  { 
    id: 'finance', 
    label: 'Финансы', 
    icon: 'DollarSign'
  }
];

/**
 * Маппинг иконок для динамической загрузки
 * 
 * ЛОГИКА: Позволяет использовать строковые названия иконок в конфигурации
 * Альтернатива - передавать React компоненты напрямую, но это усложняет сериализацию
 */
export const ICON_MAP = {
  Calendar,
  CalendarRange,
  Users,
  MessageSquare,
  Clock,
  DollarSign,
  Dices,
  BookOpen
};

/**
 * Градиенты для категорий услуг
 * 
 * ЛОГИКА ЦВЕТОВ:
 * - Золотой: премиум, роскошь (premium)
 * - Зеленый: природный, здоровье, рост (mid)  
 * - Фиолетовый: скорость, динамика (fast)
 * - Цикличное использование для неограниченного количества категорий
 */
export const CATEGORY_GRADIENTS: CategoryGradient[] = [
  {
    background: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    text: 'text-yellow-400',
    icon: 'text-yellow-400'
  },
  {
    background: 'from-green-500/20 to-green-600/20 border-green-500/30', 
    text: 'text-green-400',
    icon: 'text-green-400'
  },
  {
    background: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    text: 'text-purple-400', 
    icon: 'text-purple-400'
  }
];

/**
 * Временные фильтры - для дашборда
 * 
 * ЛОГИКА НАЗВАНИЙ:
 * - Простые и понятные названия
 * - От частого к редкому использованию
 */
export const TIME_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Все' },
  { value: 'day' as const, label: 'Сегодня' },
  { value: 'week' as const, label: '7 дней' },
  { value: 'month' as const, label: 'Этот месяц' },
  { value: 'upcoming' as const, label: 'Будущие' }
];

/**
 * Объединенные опции фильтра (время + статус) - для записей
 * 
 * ЛОГИКА НАЗВАНИЙ:
 * Временные фильтры:
 * - Простые и понятные названия
 * - От частого к редкому использованию
 * Статусные фильтры:
 * - Подтвержденные, завершенные, отмененные, неявки
 * - Исключили "ожидающие" так как все записи теперь автоматически подтверждаются
 */
export const PERIOD_FILTER_OPTIONS = [
  // Временные фильтры
  { value: 'all' as const, label: 'Все' },
  { value: 'upcoming' as const, label: 'Будущие' },
  { value: 'day' as const, label: 'Сегодня' },
  { value: 'week' as const, label: '7 дней' },
  { value: 'month' as const, label: 'Этот месяц' },
  // Разделитель (визуально в UI)
  { value: 'confirmed' as const, label: 'Подтвержденные' },
  { value: 'completed' as const, label: 'Завершенные' },
  { value: 'canceled' as const, label: 'Отмененные' },
  { value: 'no_show' as const, label: 'Неявки' }
];

/**
 * Опции периодов для графика доходов
 * 
 * ЛОГИКА ГРАНУЛЯРНОСТИ:
 * - 7 дней: по дням (детальный анализ текущей недели)
 * - 30 дней: по неделям (средний период, баланс детализации)
 * - 3 месяца: по месяцам (долгосрочные тренды)
 */
export const CHART_PERIOD_OPTIONS = [
  { value: '7days' as const, label: 'Last 7 days' },
  { value: '30days' as const, label: 'Last 30 days' }, 
  { value: '3months' as const, label: 'Last 3 months' }
];

/**
 * CSS классы для статусов записей
 * 
 * ЛОГИКА ЦВЕТОВОГО КОДИРОВАНИЯ:
 * - pending (ожидает): amber (предупреждение, требует внимания)
 * - confirmed (подтверждена): green (позитив, готово к работе)
 * - completed (завершена): slate (нейтрально, завершено)
 * - canceled (отменена): red (негатив, потерянная возможность)
 * - no_show (неявка): gray с прозрачностью (пассивный негатив)
 */
export const STATUS_STYLES = {
  pending: {
    background: 'bg-gradient-to-r from-amber-600 to-amber-500',
    text: 'text-amber-100',
    border: 'border-amber-500/20',
    icon: 'bg-amber-400'
  },
  confirmed: {
    background: 'bg-gradient-to-r from-[#4F8A3E] to-[#6B9E58]',
    text: 'text-green-100', 
    border: 'border-green-500/20',
    icon: 'bg-green-400'
  },
  completed: {
    background: 'bg-gradient-to-r from-slate-600 to-slate-500',
    text: 'text-slate-100',
    border: 'border-slate-500/20', 
    icon: 'bg-slate-400'
  },
  canceled: {
    background: 'bg-gradient-to-r from-[#541c15] to-[#6B2319]',
    text: 'text-red-100',
    border: 'border-red-500/20',
    icon: 'bg-red-400'  
  },
  no_show: {
    background: 'bg-gradient-to-r from-gray-600 to-gray-500 opacity-70',
    text: 'text-gray-100',
    border: 'border-gray-500/20',
    icon: 'bg-gray-400'
  }
};

/**
 * Человекочитаемые названия статусов
 * 
 * ЛОГИКА ЛОКАЛИЗАЦИИ:
 * - Все на русском языке для русскоязычных админов
 * - Короткие и понятные формулировки
 */
export const STATUS_LABELS = {
  pending: 'Ожидает',
  confirmed: 'Подтверждена', 
  completed: 'Завершена',
  canceled: 'Аннулирована',
  no_show: 'Неявка'
} as const;

/**
 * Названия месяцев для графиков
 * 
 * ЛОГИКА: Короткие английские названия для компактности на графиках
 */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Названия дней недели для графиков
 * 
 * ЛОГИКА: Короткие английские названия, начиная с воскресенья (JS Date.getDay())
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];