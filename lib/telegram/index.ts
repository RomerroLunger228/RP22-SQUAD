// lib/telegram/index.ts
/**
 * Центральный экспорт всех Telegram функций
 * Обеспечивает обратную совместимость с существующими импортами
 */

// Экспорт из core.ts
export { sendMessage } from './core';

// Экспорт из auth.ts
export { handleReferralSystem, handleStartCommand } from './auth';

// Экспорт из notifications.ts
export {
  sendAppointmentNotification,
  notifyAdminAboutNewAppointment,
  notifyAdminAboutCancelledAppointment,
  notifyUserAboutAppointmentStatus
} from './notifications';

// Экспорт из reminders.ts
export {
  sendDailyReminderNotification,
  notifyReferrerAboutCompletedReferral,
  type DailyReminderContext
} from './reminders';

// Реэкспорт типов для совместимости
export type { NotificationAction, NotificationContext, UserRole } from '@/types/notifications';