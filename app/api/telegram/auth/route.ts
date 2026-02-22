import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { TelegramUser } from '@/types/telegram';
import { createAuthToken, type BaseUserPayload } from '@/lib/auth-jwt';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Используем сгенерированные типы Prisma с приведением
type UserWithSubscription = {
  id: number;
  username: string;
  points: number | null;
  role: string;
  avatar_url: string | null;
  telegram_id: string | null;
  subscription: {
    status: string | null;
  } | null;
};

interface TelegramValidationResult {
  isValid: boolean;
  user?: TelegramUser;
  error?: string;
}


interface UserResponse {
  id: number;
  telegram_id: string | null;
  username: string;
  points: number | null;
  role: string;
  avatar_url: string | null;
  subscription: boolean; // hasActiveSubscription
}

export async function POST(request: NextRequest) {
  try {
    const { initData }: { initData: string } = await request.json();

    console.log('🔐 Telegram auth attempt...');

    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'No initData provided' },
        { status: 400 }
      );
    }

    const validationResult = validateTelegramWebAppData(initData);
    
    if (!validationResult.isValid) {
      console.error('❌ Invalid Telegram data:', validationResult.error);
      
      // Специальная обработка для устаревших данных
      if (validationResult.error === 'Data too old') {
        return NextResponse.json(
          { success: false, error: 'Data too old', code: 'TELEGRAM_DATA_EXPIRED' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    const telegramUser = validationResult.user;
    
    if (!telegramUser) {
      return NextResponse.json(
        { success: false, error: 'No user data in initData' },
        { status: 400 }
      );
    }

    console.log('👤 Telegram user:', telegramUser.id, telegramUser.first_name);

    let user = await prisma.users.findUnique({
      where: { telegram_id: telegramUser.id.toString() },
      include: {
        subscription: true
      }
    }) as UserWithSubscription | null;

    if (!user) {
      console.log('🆕 Creating new user for Telegram ID:', telegramUser.id);
      
      const username = telegramUser.username || 
                      `${telegramUser.first_name}${telegramUser.last_name ? `_${telegramUser.last_name}` : ''}` ||
                      `user_${telegramUser.id}`;

      user = await prisma.users.create({
        data: {
          telegram_id: telegramUser.id.toString(),
          username: username,
          points: 0,
          role: 'user',
          avatar_url: telegramUser.photo_url || null
        },
        include: {
          subscription: true
        }
      }) as UserWithSubscription;

      console.log('✅ New user created:', user.id);
    } else {
      // ✅ ВСЕГДА проверяем и обновляем данные при входе
      const telegramUsername = telegramUser.username || 
                              `${telegramUser.first_name}${telegramUser.last_name ? `_${telegramUser.last_name}` : ''}` ||
                              user.username; // fallback на текущий username
      
      const telegramAvatarUrl = telegramUser.photo_url || null;

      // Проверяем изменился ли username или avatar, или если avatar_url отсутствует
      const usernameChanged = telegramUsername !== user.username;
      const avatarChanged = telegramAvatarUrl !== user.avatar_url;
      const avatarMissing = !user.avatar_url && telegramAvatarUrl; // Если у пользователя нет avatar_url, но у Telegram есть

      if (usernameChanged || avatarChanged || avatarMissing) {
        console.log('🔄 Detected user data changes or missing data:', {
          usernameChanged: usernameChanged ? `${user.username} → ${telegramUsername}` : false,
          avatarChanged: avatarChanged ? 'avatar updated' : false,
          avatarMissing: avatarMissing ? 'adding missing avatar' : false
        });

        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            username: telegramUsername,
            avatar_url: telegramAvatarUrl
          },
          include: {
            subscription: true
          }
        }) as UserWithSubscription;
        
        console.log('✅ User data synchronized with Telegram');
      } else {
        console.log('✅ User data up to date, no changes needed');
      }

      console.log('✅ Existing user processed:', user.id);
    }

    // ✅ ВСЕГДА создаем новый JWT токен с актуальными данными
    // Даже если данные не изменились, токен будет новый (новые iat/exp)
    // Если данные изменились - токен автоматически содержит свежую информацию
    const tokenPayload: BaseUserPayload = {
      userId: user.id,
      telegramId: user.telegram_id!,
      username: user.username // ← Всегда актуальный username из DB
    };
    const authToken = await createAuthToken(tokenPayload);

    // Проверяем активную подписку
    const hasActiveSubscription = !!(user.subscription && user.subscription.status === 'active');

    const userResponse: UserResponse = {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      points: user.points,
      role: user.role,
      avatar_url: user.avatar_url,
      subscription: hasActiveSubscription
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
      token: authToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('❌ Telegram auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

function validateTelegramWebAppData(initData: string): TelegramValidationResult {
  if (!BOT_TOKEN) {
    return { isValid: false, error: 'Bot token not configured' };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    if (!hash) {
      return { isValid: false, error: 'No hash in initData' };
    }

    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    const isValid = calculatedHash === hash;

    if (!isValid) {
      return { isValid: false, error: 'Hash validation failed' };
    }

    const userParam = urlParams.get('user');
    if (!userParam) {
      return { isValid: false, error: 'No user data in initData' };
    }

    const user = JSON.parse(userParam) as TelegramUser;
    
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 3600) {
      return { isValid: false, error: 'Data too old' };
    }

    return { isValid: true, user };

  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}

// GET метод удален - теперь используем JWT токены
// Валидация происходит в auth-jwt.ts без DB запросов