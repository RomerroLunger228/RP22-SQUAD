
export {
  sendMessage,
  handleReferralSystem,
  handleStartCommand,
  sendAppointmentNotification,
  notifyAdminAboutNewAppointment,
  notifyAdminAboutCancelledAppointment,
  notifyUserAboutAppointmentStatus,
  sendDailyReminderNotification,
  notifyReferrerAboutCompletedReferral,
  type DailyReminderContext
} from './telegram/index';


export type { NotificationAction, NotificationContext, UserRole } from '@/types/notifications';