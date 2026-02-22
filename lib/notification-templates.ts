import { NotificationAction, NotificationContext, NotificationTemplate, UserRole } from '@/types/notifications';

/**
 * Генератор темплейтов уведомлений для разных ролей и действий
 */

/**
 * Форматирует время в читаемый формат HH:MM
 */
function formatTime(timeInput: string | Date | unknown): string {
  if (!timeInput) return '';
  
  // Если это уже строка в формате времени HH:MM или HH:MM:SS
  if (typeof timeInput === 'string' && timeInput.includes(':')) {
    return timeInput.slice(0, 5);
  }
  
  // Если это Date объект или строка с датой
  try {
    let date: Date;
    
    if (timeInput instanceof Date) {
      date = timeInput;
    } else if (typeof timeInput === 'string') {
      date = new Date(timeInput);
    } else {
      // Если это что-то еще, попробуем преобразовать в строку
      date = new Date(timeInput.toString());
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Не удалось распарсить время:', timeInput);
      return '00:00';
    }
    
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Ошибка форматирования времени:', error, 'input:', timeInput);
    return '00:00';
  }
}

export function getNotificationTemplate(
  action: NotificationAction,
  targetRole: UserRole,
  context: NotificationContext
): NotificationTemplate {
  console.log(`🎨 [TEMPLATE] Генерация темплейта для: ${action} → ${targetRole}`);
  console.log(`📋 [TEMPLATE] Входные данные:`, {
    serviceTitle: context.serviceTitle,
    appointmentDate: context.appointmentDate,
    appointmentTime: context.appointmentTime,
    appointmentTimeType: typeof context.appointmentTime,
    userName: context.userName,
    appointmentId: context.appointmentId
  });
  
  const { serviceTitle, appointmentDate, appointmentTime, userName, appointmentId } = context;
  
  // Форматируем дату с днем недели: "понедельник, 15 января"
  const date = new Date(appointmentDate);
  const formattedDate = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric', 
    month: 'long'
  });
  
  console.log(`📅 [TEMPLATE] Отформатированная дата: "${formattedDate}"`);
  
  const formattedTime = formatTime(appointmentTime);
  console.log(`🕐 [TEMPLATE] Отформатированное время: "${formattedTime}"`);
  
  console.log(`📝 [TEMPLATE] Будет сгенерирован темплейт для: ${targetRole} - ${action}`);

  // Темплейты для админа
  if (targetRole === 'admin') {
    switch (action) {
      case 'appointment_created':
        return {
          title: '🔔 Новая запись!',
          message: `📅 <b>Новая запись от ${userName}</b>\n\n` +
                  `🔹 Услуга: ${serviceTitle}\n` +
                  `🕐 Дата: ${formattedDate} в ${formattedTime}\n` +
                  `👤 Клиент: @${userName}\n` +
                  `🆔 ID записи: #${appointmentId}\n\n` +
                  `✅ Автоматически подтверждена`
        };

      case 'appointment_cancelled':
        const cancelTemplate = {
          title: '❌ Отмена записи',
          message: `💔 <b>Клиент отменил запись</b>\n\n` +
                  `🔹 Услуга: ${serviceTitle}\n` +
                  `🕐 Была на: ${formattedDate} в ${formattedTime}\n` +
                  `👤 Клиент: @${userName}\n` +
                  `🆔 ID записи: #${appointmentId}`
        };
        console.log(`✅ [TEMPLATE] Готовое сообщение об отмене:`, cancelTemplate);
        return cancelTemplate;

      default:
        return {
          title: '🔔 Обновление записи',
          message: `ℹ️ Статус записи #${appointmentId} обновлен`
        };
    }
  }

  // Темплейты для пользователей
  switch (action) {
    case 'appointment_confirmed':
      return {
        title: '✅ Запись подтверждена!',
        message: `🎉 <b>Ваша запись подтверждена!</b>\n\n` +
                `🔹 Услуга: ${serviceTitle}\n` +
                `🕐 Дата: ${formattedDate} в ${formattedTime}\n` +
                `🆔 ID записи: #${appointmentId}\n\n` +
                `📍 Ждем вас вовремя!`
      };

    case 'appointment_rejected':
      return {
        title: '❌ Запись отклонена',
        message: `😔 <b>К сожалению, ваша запись отклонена</b>\n\n` +
                `🔹 Услуга: ${serviceTitle}\n` +
                `🕐 Было на: ${formattedDate} в ${formattedTime}\n` +
                `🆔 ID записи: #${appointmentId}\n\n` +
                `💡 Попробуйте выбрать другое время`
      };

    case 'appointment_completed':
      return {
        title: '🎊 Прием завершен!',
        message: `✨ <b>Спасибо за визит!</b>\n\n` +
                `🔹 Услуга: ${serviceTitle}\n` +
                `🕐 Дата: ${formattedDate} в ${formattedTime}\n` +
                `🆔 ID записи: #${appointmentId}\n\n` +
                `⭐ Будем рады видеть вас снова!`
      };

    case 'appointment_no_show':
      return {
        title: '😞 Пропущен прием',
        message: `⏰ <b>Вы пропустили запись</b>\n\n` +
                `🔹 Услуга: ${serviceTitle}\n` +
                `🕐 Было на: ${formattedDate} в ${formattedTime}\n` +
                `🆔 ID записи: #${appointmentId}\n\n` +
                `📝 В следующий раз не забудьте прийти`
      };

    default:
      return {
        title: '🔔 Уведомление',
        message: `ℹ️ Обновление по вашей записи #${appointmentId}`
      };
  }
}

/**
 * Получить emoji для типа уведомления
 */
export function getNotificationEmoji(action: NotificationAction): string {
  const emojiMap: Record<NotificationAction, string> = {
    'appointment_created': '🔔',
    'appointment_cancelled': '❌',
    'appointment_confirmed': '✅',
    'appointment_rejected': '❌',
    'appointment_completed': '🎊',
    'appointment_no_show': '😞'
  };

  return emojiMap[action] || '🔔';
}