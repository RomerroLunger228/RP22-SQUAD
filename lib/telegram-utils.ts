import { prisma } from './prisma';
import { NotificationAction, NotificationContext, UserRole } from '@/types/notifications';
import { getNotificationTemplate } from './notification-templates';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Функция отправки сообщения в Telegram
export async function sendMessage(chatId: number, text: string) {
  const startTime = Date.now();
  console.log(`📤 [TELEGRAM] Начало отправки сообщения на chat_id: ${chatId}`);
  console.log(`📝 [TELEGRAM] Длина сообщения: ${text.length} символов`);
  console.log(`📝 [TELEGRAM] Содержимое сообщения: ${text.substring(0, 200)}...`);
  
  // Проверяем наличие BOT_TOKEN
  if (!BOT_TOKEN) {
    console.error('❌ [TELEGRAM] TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
    return false;
  }
  
  // Проверяем длину сообщения (лимит Telegram 4096 символов)
  if (text.length > 4096) {
    console.error('❌ [TELEGRAM] Сообщение слишком длинное:', text.length);
    return false;
  }
  
  try {
    // Добавляем AbortSignal для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [TELEGRAM] Превышен таймаут 15сек для chat_id: ${chatId}`);
      controller.abort();
    }, 15000); // 15 секунд таймаут
    
    const requestBody = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    
    console.log(`🌐 [TELEGRAM] Отправка запроса к Telegram API...`);
    console.log(`📋 [TELEGRAM] Размер тела запроса: ${requestBody.length} байт`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ [TELEGRAM] Ответ от Telegram API получен за ${duration}ms`);
    console.log(`📊 [TELEGRAM] HTTP статус: ${response.status}`);
    
    if (!response.ok) {
      console.error('❌ [TELEGRAM] HTTP ошибка:', {
        chat_id: chatId,
        status: response.status,
        statusText: response.statusText,
        duration: duration
      });
      return false;
    }
    
    console.log(`📖 [TELEGRAM] Чтение JSON ответа...`);
    const result = await response.json();
    console.log(`📋 [TELEGRAM] Получен ответ от Telegram:`, {
      ok: result.ok,
      message_id: result.result?.message_id,
      error_code: result.error_code,
      description: result.description
    });
    
    if (!result.ok) {
      console.error('❌ [TELEGRAM] Ошибка отправки сообщения:', {
        chat_id: chatId,
        error_code: result.error_code,
        description: result.description,
        duration: duration
      });
      return false;
    }
    
    console.log(`✅ [TELEGRAM] Сообщение отправлено успешно на chat_id: ${chatId} за ${duration}ms`);
    console.log(`📋 [TELEGRAM] Message ID: ${result.result?.message_id}`);
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`⏰ [TELEGRAM] Таймаут при отправке сообщения на chat_id: ${chatId} (${duration}ms)`);
    } else {
      console.error(`❌ [TELEGRAM] Ошибка при отправке сообщения на chat_id: ${chatId}:`, {
        error: error instanceof Error ? error.message : error,
        duration: duration,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    return false;
  }
}

// Обработка реферальной системы (только для НОВЫХ пользователей)
export async function handleReferralSystem(telegramId: string, referrerTelegramId?: string, isNewUser: boolean = false) {
  try {
    // Реферальный бонус только для новых пользователей
    if (!isNewUser) {
      console.log('⚠️ Реферальный бонус только для новых пользователей');
      return null;
    }

    // Если нет referrerTelegramId, пропускаем
    if (!referrerTelegramId) {
      return null;
    }

    // Проверяем что реферер существует и это не сам пользователь
    if (referrerTelegramId === telegramId) {
      console.log('⚠️ Нельзя указать себя как реферера');
      return null;
    }

    const referrer = await prisma.users.findUnique({
      where: { telegram_id: referrerTelegramId },
      select: { id: true, points: true, username: true }
    });

    if (!referrer) {
      console.log('⚠️ Реферер не найден:', referrerTelegramId);
      return null;
    }

    // Обновляем пользователя - добавляем реферера
    await prisma.users.update({
      where: { telegram_id: telegramId },
      data: { referred_by: referrerTelegramId }
    });

    // Начисляем 10 поинтов рефереру
    const newReferrerPoints = (referrer.points || 0) + 10;
    await prisma.users.update({
      where: { telegram_id: referrerTelegramId },
      data: { points: newReferrerPoints }
    });

    console.log('✅ Реферальный бонус начислен:', {
      referrer: referrer.username,
      newPoints: newReferrerPoints,
      referred: telegramId
    });

    return {
      referrerName: referrer.username,
      pointsAwarded: 10
    };

  } catch (error) {
    console.error('❌ Ошибка в реферальной системе:', error);
    return null;
  }
}

// Обработка команды /start с автоматической регистрацией и реферальной системой
export async function handleStartCommand(chatId: number, from: { first_name?: string; last_name?: string; username?: string; id?: number }, startParams?: string) {
  const telegramId = from?.id?.toString();
  
  if (!telegramId) {
    console.log('❌ Нет telegram_id пользователя');
    return await sendMessage(chatId, 'Ошибка: не удалось получить ваш ID');
  }

  let referralMessage = '';
  let isNewUser = false;
  let referrerTelegramId = null;

  try {
    // Проверяем существует ли пользователь
    let user = await prisma.users.findUnique({
      where: { telegram_id: telegramId },
      select: { id: true, username: true, referred_by: true }
    });

    // Если пользователя нет - регистрируем
    if (!user) {
      console.log('🆕 Регистрируем нового пользователя:', telegramId);
      isNewUser = true;
      
      const username = from?.username || 
                      `${from?.first_name}${from?.last_name ? `_${from?.last_name}` : ''}` ||
                      `user_${from?.id}`;

      // Создаем пользователя с реферером если есть
      if (startParams) {
        // Поддерживаем формат ref_123456789 и просто 123456789
        referrerTelegramId = startParams.startsWith('ref_') 
          ? startParams.substring(4) 
          : startParams;
      }

      const userData = {
        telegram_id: telegramId,
        username: username,
        points: 0,
        role: 'user' as const,
        ...(referrerTelegramId && { referred_by: referrerTelegramId })
      };

      user = await prisma.users.create({
        data: userData,
        select: { id: true, username: true, referred_by: true }
      });

      console.log('✅ Пользователь создан:', user.id);
    }

    // Обработка реферальной системы только для новых пользователей
    if (isNewUser && referrerTelegramId && user.referred_by === referrerTelegramId) {
      const referralResult = await handleReferralSystem(telegramId, referrerTelegramId, true);
      
      if (referralResult) {
        referralMessage = `\n🎉 <b>Поздравляем!</b> Вас пригласил ${referralResult.referrerName}!\nВаш друг получил +${referralResult.pointsAwarded} поинтов! 🎁\n`;
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при обработке пользователя:', error);
  }

  const welcomeMessage = `
🎉 <b>Добро пожаловать в RP22!</b>

Привет, ${from?.first_name || 'друг'}! 👋
${referralMessage}
Я бот для записи на услуги. Вот что я умею:
• 📅 Записать на прием
• 📋 Показать ваши записи  


⚠️ <b>Это MVP версия приложения</b>
В случае проблем - просто перезапустите мини-приложение

🔧 При поломках или сбоях обращайтесь: @federal0dev

Чтобы начать, запустите мини-приложение!
  `;
  
  return await sendMessage(chatId, welcomeMessage.trim());
}

/**
 * СИСТЕМА УВЕДОМЛЕНИЙ О ЗАПИСЯХ
 */

/**
 * Универсальная функция для отправки уведомлений о записях
 */
export async function sendAppointmentNotification(
  action: NotificationAction,
  targetRole: UserRole,
  telegramId: string,
  context: NotificationContext
): Promise<boolean> {
  console.log(`🚀 [NOTIFICATION] Отправка уведомления: ${action} → ${targetRole} (telegram_id: ${telegramId})`);
  console.log(`📋 [NOTIFICATION] Контекст:`, {
    appointmentId: context.appointmentId,
    serviceTitle: context.serviceTitle,
    appointmentDate: context.appointmentDate,
    appointmentTime: context.appointmentTime,
    userName: context.userName
  });
  
  try {
    // Получаем темплейт сообщения
    const template = getNotificationTemplate(action, targetRole, context);
    console.log(`📝 [NOTIFICATION] Сгенерирован темплейт: ${template.title}`);
    
    // Преобразуем telegram_id в chat_id
    const chatId = parseInt(telegramId);
    
    if (isNaN(chatId)) {
      console.error('❌ [NOTIFICATION] Неверный telegram_id:', telegramId);
      return false;
    }

    // Отправляем сообщение
    console.log(`📤 [NOTIFICATION] Вызов sendMessage для chat_id: ${chatId}`);
    const sent = await sendMessage(chatId, template.message);
    
    if (sent) {
      console.log(`✅ [NOTIFICATION] Уведомление успешно отправлено: ${action} → ${targetRole} (${telegramId})`);
    } else {
      console.error(`❌ [NOTIFICATION] Не удалось отправить уведомление: ${action} → ${targetRole} (${telegramId})`);
    }
    
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
interface AdminUser {
  telegram_id: string | null;
  username: string | null;
}

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
  console.log(`🔔 [USER_NOTIFY] Начало отправки уведомления пользователю о статусе записи #${context.appointmentId}`);
  console.log(`👤 [USER_NOTIFY] Уведомление для пользователя: ${context.userName} (telegram_id: ${userTelegramId})`);
  console.log(`📋 [USER_NOTIFY] Действие: ${action}`);
  
  try {
    const result = await sendAppointmentNotification(
      action,
      'user',
      userTelegramId,
      context
    );

    if (result) {
      console.log(`✅ [USER_NOTIFY] Уведомление пользователю отправлено успешно: ${action}`);
    } else {
      console.error(`❌ [USER_NOTIFY] Не удалось отправить уведомление пользователю: ${action}`);
    }

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

/**
 * ЕЖЕДНЕВНЫЕ НАПОМИНАНИЯ О ЗАПИСЯХ
 */

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
  console.log(`🌅 [DAILY_REMINDER] Отправка ежедневного напоминания пользователю ${context.userName} о записи #${context.appointmentId}`);
  
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
    console.log(`📤 [DAILY_REMINDER] Отправка напоминания на chat_id: ${chatId}`);
    const sent = await sendMessage(chatId, message);
    
    if (sent) {
      console.log(`✅ [DAILY_REMINDER] Ежедневное напоминание успешно отправлено пользователю ${context.userName}`);
    } else {
      console.error(`❌ [DAILY_REMINDER] Не удалось отправить ежедневное напоминание пользователю ${context.userName}`);
    }
    
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
  console.log(`🎯 [REFERRAL_NOTIFY] Уведомление реферера ${referrerTelegramId} о завершении визита ${referredUsername}`);
  
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

    console.log(`📤 [REFERRAL_NOTIFY] Отправка уведомления реферру на chat_id: ${chatId}`);
    const sent = await sendMessage(chatId, message);
    
    if (sent) {
      console.log(`✅ [REFERRAL_NOTIFY] Уведомление реферру отправлено успешно`);
    } else {
      console.error(`❌ [REFERRAL_NOTIFY] Не удалось отправить уведомление реферру`);
    }
    
    return sent;

  } catch (error) {
    console.error(`❌ [REFERRAL_NOTIFY] Ошибка отправки уведомления реферру ${referrerTelegramId}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}