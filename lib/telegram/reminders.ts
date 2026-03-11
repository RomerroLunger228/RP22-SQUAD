// lib/telegram/reminders.ts
/**
 * Напоминания и уведомления рефереров
 */

import { prisma } from '../prisma';
import { sendMessage } from './core';

/**
 * Интерфейс для ежедневных напоминаний
 */
export interface DailyReminderContext {
  userId: string;
  userName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  appointmentId: number;
}

/**
 * Отправка ежедневного напоминания пользователю о записи на сегодня
 */
export async function sendDailyReminderNotification(context: DailyReminderContext): Promise<boolean> {
  try {
    // Форматируем дату с днем недели: "понедельник, 15 января"
    const date = new Date(context.appointmentDate);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    });
    
    // Форматируем время (убираем секунды если есть)
    const formattedTime = context.appointmentTime.slice(0, 5);
    
    // Создаем сообщение с точной датой и временем
    const message = `☀️ <b>Доброе утро!</b>

У вас сегодня запись:

🔹 Услуга: <b>${context.serviceName}</b>
📅 Дата: <b>${formattedDate}</b>
⏰ Время: <b>${formattedTime}</b>
🆔 ID записи: #${context.appointmentId}

Увидимся сегодня! 🤝`;

    // Получаем telegram_id пользователя
    const user = await prisma.users.findUnique({
      where: { id: parseInt(context.userId) },
      select: { telegram_id: true }
    });

    if (!user?.telegram_id) {
      console.error(`❌ [DAILY_REMINDER] Пользователь ${context.userName} не имеет telegram_id`);
      return false;
    }

    // Преобразуем telegram_id в chat_id
    const chatId = parseInt(user.telegram_id);
    
    if (isNaN(chatId)) {
      console.error(`❌ [DAILY_REMINDER] Неверный telegram_id для пользователя ${context.userName}:`, user.telegram_id);
      return false;
    }

    // Отправляем сообщение
    const sent = await sendMessage(chatId, message);
    
    return sent;

  } catch (error) {
    console.error(`❌ [DAILY_REMINDER] Ошибка отправки ежедневного напоминания пользователю ${context.userName}:`, {
      appointmentId: context.appointmentId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Уведомление пригласившего пользователя о завершении визита рефералом
 */
export async function notifyReferrerAboutCompletedReferral(
  referrerTelegramId: string,
  referredUsername: string,
  completedCount: number,
  needMoreForNextCoupon: number
): Promise<boolean> {
  try {
    // Преобразуем telegram_id в chat_id
    const chatId = parseInt(referrerTelegramId);
    
    if (isNaN(chatId)) {
      console.error('❌ [REFERRAL_NOTIFY] Неверный telegram_id реферера:', referrerTelegramId);
      return false;
    }

    let message: string;
    
    if (needMoreForNextCoupon === 0) {
      // Получил новый купон!
      message = `🎉 <b>Поздравляем!</b>

Ваш друг <b>${referredUsername}</b> завершил свой визит! 

🎁 <b>Вы получили БЕСПЛАТНУЮ УСЛУГУ!</b>
💫 Всего завершенных рефералов: <b>${completedCount}</b>

Купон уже в вашем профиле, используйте его при следующей записи! ✨`;
    } else {
      // Прогресс к следующему купону
      message = `✅ <b>Отличные новости!</b>

Ваш друг <b>${referredUsername}</b> завершил свой визит!

📊 Прогресс:
• Завершенных рефералов: <b>${completedCount}</b>
• До бесплатной услуги: <b>${needMoreForNextCoupon}</b>

Приглашайте еще друзей и получайте больше подарков! 🎁`;
    }

    const sent = await sendMessage(chatId, message);
    
    return sent;

  } catch (error) {
    console.error(`❌ [REFERRAL_NOTIFY] Ошибка отправки уведомления реферру ${referrerTelegramId}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}