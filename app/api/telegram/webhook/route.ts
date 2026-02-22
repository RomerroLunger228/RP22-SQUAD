import { NextRequest, NextResponse } from 'next/server';
import { handleStartCommand } from '@/lib/telegram-utils';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    console.log('📥 Telegram webhook update received:', JSON.stringify(update, null, 2));
    
    // Обработка сообщений
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;
      const from = message.from;
      
      console.log('💬 Message from:', from?.username || from?.first_name);
      console.log('💬 Text:', text);
      
      // Обработка команды /start с параметрами
      if (text?.startsWith('/start')) {
        // Извлекаем start_params: "/start 123456789" -> "123456789"
        const parts = text.split(' ');
        const startParams = parts.length > 1 ? parts[1] : undefined;
        
        console.log('🚀 /start команда с параметрами:', { startParams });
        
        await handleStartCommand(chatId, from, startParams);
      }
    }
    
    // Обработка callback запросов
    if (update.callback_query) {
      console.log('🔘 Callback query from:', update.callback_query.from?.username || update.callback_query.from?.first_name);
      console.log('🔘 Data:', update.callback_query.data);
    }
    
    // Возвращаем 200 OK для подтверждения получения
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}