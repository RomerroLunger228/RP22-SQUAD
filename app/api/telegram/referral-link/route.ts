import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/auth-jwt';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'RP22_mvp_bot';

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const result = await validateAuthToken(token);
    
    if (!result.isValid || !result.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const payload = result.user;

    // Генерируем реферальную ссылку
    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${payload.telegramId}`;
    
    // Генерируем URL для нативного шаринга
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`;

    const response = NextResponse.json({
      success: true,
      data: {
        referralLink,
        shareUrl,
        botUsername: BOT_USERNAME,
        userId: payload.telegramId
      }
    });

    // Кэшируем ответ на 24 часа, так как реферальная ссылка никогда не меняется
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    
    return response;

  } catch (error) {
    console.error('❌ Ошибка генерации реферальной ссылки:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}