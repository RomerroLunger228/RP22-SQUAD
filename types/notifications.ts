/**
 * Типы для системы уведомлений о записях
 */

export type NotificationAction = 
  | 'appointment_created'      // Пользователь создал запись
  | 'appointment_cancelled'    // Пользователь отменил запись  
  | 'appointment_confirmed'    // Админ подтвердил запись
  | 'appointment_rejected'     // Админ отменил запись
  | 'appointment_completed'    // Админ завершил прием
  | 'appointment_no_show';     // Админ отметил неявку

export type UserRole = 'user' | 'admin';

export interface NotificationContext {
  appointmentId: number;
  userId: number;
  serviceTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  userName: string;
}

export interface NotificationConfig {
  action: NotificationAction;
  targetRole: UserRole;
  telegramId: string;
  context: NotificationContext;
}

export interface NotificationTemplate {
  title: string;
  message: string;
}