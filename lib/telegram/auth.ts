// lib/telegram/auth.ts
/**
 * Функции авторизации и реферальной системы
 */

import { prisma } from '../prisma';
import { sendMessage } from './core';

/**
 * Обработка реферальной системы (только для НОВЫХ пользователей)
 */
export async function handleReferralSystem(telegramId: string, referrerTelegramId?: string, isNewUser: boolean = false) {
  try {
    // Реферальный бонус только для новых пользователей
    if (!isNewUser) {
      return null;
    }

    // Если нет referrerTelegramId, пропускаем
    if (!referrerTelegramId) {
      return null;
    }

    // Проверяем что реферер существует и это не сам пользователь
    if (referrerTelegramId === telegramId) {
      return null;
    }

    const referrer = await prisma.users.findUnique({
      where: { telegram_id: referrerTelegramId },
      select: { id: true, points: true, username: true }
    });

    if (!referrer) {
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

    return {
      referrerName: referrer.username,
      pointsAwarded: 10
    };

  } catch (error) {
    console.error('❌ Ошибка в реферальной системе:', error);
    return null;
  }
}

/**
 * Обработка команды /start с автоматической регистрацией и реферальной системой
 */
export async function handleStartCommand(
  chatId: number, 
  from: { first_name?: string; last_name?: string; username?: string; id?: number }, 
  startParams?: string
) {
  const telegramId = from?.id?.toString();
  
  if (!telegramId) {
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