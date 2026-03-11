// lib/telegram/notifications.ts
/**
 * Система уведомлений о записях
 */

import { prisma } from '../prisma';
import { NotificationAction, NotificationContext, UserRole } from '@/types/notifications';
import { getNotificationTemplate } from '../notification-templates';
import { sendMessage } from './core';

interface AdminUser {
  telegram_id: string | null;
  username: string | null;
}

/**
 * Универсальная функция для отправки уведомлений о записях
 */
export async function sendAppointmentNotification(
  action: NotificationAction,
  targetRole: UserRole,
  telegramId: string,
  context: NotificationContext
): Promise<boolean> {
  try {
    // Получаем темплейт сообщения
    const template = getNotificationTemplate(action, targetRole, context);
    
    // Преобразуем telegram_id в chat_id
    const chatId = parseInt(telegramId);
    
    if (isNaN(chatId)) {
      console.error('❌ [NOTIFICATION] Неверный telegram_id:', telegramId);
      return false;
    }

    // Отправляем сообщение
    const sent = await sendMessage(chatId, template.message);
    
    return sent;

  } catch (error) {
    console.error(`❌ [NOTIFICATION] Ошибка отправки уведомления: ${action} → ${targetRole} (${telegramId}):`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Уведомление админу о новой записи
 */
export async function notifyAdminAboutNewAppointment(context: NotificationContext): Promise<boolean> {
  try {
    // Получаем всех админов с telegram_id
    const admins: AdminUser[] = await prisma.users.findMany({
      where: {
        role: 'admin',
        telegram_id: { not: null }
      },
      select: { telegram_id: true, username: true }
    });

    if (admins.length === 0) {
      return false;
    }

    // Отправляем уведомления всем админам
    const results = await Promise.allSettled(
      admins.map((admin) => {
        return sendAppointmentNotification(
          'appointment_created',
          'admin',
          admin.telegram_id!,
          context
        );
      })
    );

    const successResults = results.filter((result): result is PromiseFulfilledResult<boolean> => result.status === 'fulfilled' && result.value === true);
    
    return successResults.length > 0;

  } catch (error) {
    console.error(`❌ [ADMIN_NOTIFY] Ошибка уведомления админов о записи #${context.appointmentId}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Уведомление админу об отмене записи
 */
export async function notifyAdminAboutCancelledAppointment(context: NotificationContext): Promise<boolean> {
  try {
    const admins: AdminUser[] = await prisma.users.findMany({
      where: {
        role: 'admin',
        telegram_id: { not: null }
      },
      select: { telegram_id: true, username: true }
    });

    if (admins.length === 0) {
      return false;
    }

    const results = await Promise.allSettled(
      admins.map((admin) => {
        return sendAppointmentNotification(
          'appointment_cancelled',
          'admin',
          admin.telegram_id!,
          context
        );
      })
    );

    const successResults = results.filter((result): result is PromiseFulfilledResult<boolean> => result.status === 'fulfilled' && result.value === true);

    return successResults.length > 0;

  } catch (error) {
    console.error(`❌ [ADMIN_CANCEL] Ошибка уведомления админов об отмене записи #${context.appointmentId}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Уведомление пользователю об изменении статуса записи
 */
export async function notifyUserAboutAppointmentStatus(
  action: NotificationAction,
  userTelegramId: string,
  context: NotificationContext
): Promise<boolean> {
  try {
    const result = await sendAppointmentNotification(
      action,
      'user',
      userTelegramId,
      context
    );

    return result;

  } catch (error) {
    console.error(`❌ [USER_NOTIFY] Ошибка уведомления пользователя ${context.userName} (${userTelegramId}):`, {
      action,
      appointmentId: context.appointmentId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}