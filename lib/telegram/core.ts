// lib/telegram/core.ts
/**
 * Базовые функции для работы с Telegram API
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Отправка сообщения в Telegram
 */
export async function sendMessage(chatId: number, text: string): Promise<boolean> {
  const startTime = Date.now();
  
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
      controller.abort();
    }, 15000); // 15 секунд таймаут
    
    const requestBody = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    
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
    
    if (!response.ok) {
      console.error('❌ [TELEGRAM] HTTP ошибка:', {
        chat_id: chatId,
        status: response.status,
        statusText: response.statusText,
        duration: duration
      });
      return false;
    }
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ [TELEGRAM] Ошибка отправки сообщения:', {
        chat_id: chatId,
        error_code: result.error_code,
        description: result.description,
        duration: duration
      });
      return false;
    }
    
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