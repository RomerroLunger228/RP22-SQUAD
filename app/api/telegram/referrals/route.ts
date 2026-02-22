import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/auth-jwt';
import { prisma } from '@/lib/prisma';

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

    const currentUser = result.user;

    // Получаем данные текущего пользователя с реферальной информацией
    const userData = await prisma.users.findUnique({
      where: { telegram_id: currentUser.telegramId },
      select: {
        id: true,
        referral_completed_unique: true,
        referral_rewards_used: true,
      }
    });

    // 🎁 Считаем количество доступных купонов
    const availableCoupons = await prisma.coupons.count({
      where: {
        user_id: userData?.id,
        is_used: false
      }
    });

    // Получаем список пользователей, которых пригласил текущий пользователь
    const referrals = await prisma.users.findMany({
      where: {
        referred_by: currentUser.telegramId
      },
      select: {
        id: true,
        username: true,
        points: true,
        telegram_id: true,
        avatar_url: true,
      },
      orderBy: {
        id: 'desc' // Сортируем по ID (новые сначала)
      }
    });

    // 🎁 Для каждого реферала получаем количество завершенных визитов
    const formattedReferrals = await Promise.all(
      referrals.map(async (referral) => {
        const completedVisits = await prisma.appointments.count({
          where: {
            user_id: referral.id,
            status: 'completed'
          }
        });

        return {
          id: referral.id,
          username: referral.username,
          points: referral.points || 0,
          avatar_url: referral.avatar_url,
          completedVisits: completedVisits
        };
      })
    );

    // Подсчитываем статистику
    const totalReferrals = referrals.length;
    const totalPointsEarned = totalReferrals * 10; // По 10 поинтов за каждого реферала

    return NextResponse.json({
      success: true,
      data: {
        referrals: formattedReferrals,
        stats: {
          totalReferrals,
          totalPointsEarned,
          currentMonthReferrals: totalReferrals,
        },
        // 🎁 Новые поля для купонов
        referralCompletedUnique: userData?.referral_completed_unique || 0,
        availableCoupons: availableCoupons
      }
    });

  } catch (error) {
    console.error('❌ Ошибка получения рефералов:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}