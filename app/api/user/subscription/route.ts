import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';
import '@/lib/bigint-json';

export async function GET(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    let userId = await getCurrentUserId(request);
    
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // Проверяем, запрашивает ли админ подписку другого пользователя
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');
    
    if (requestedUserId) {
      // Проверяем, что текущий пользователь - админ
      const currentUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!currentUser || currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Используем ID запрашиваемого пользователя
      userId = parseInt(requestedUserId);
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        user_id: userId
      },
      include: {
        subscription_plans: {
          include: {
            services: true,
            subscription_tiers: true
          }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false
      });
    }

    const isExpired = subscription.expires_at ? new Date() > subscription.expires_at : false;

    if (isExpired && subscription.status !== 'expired') {
      await prisma.subscription.update({
        where: { user_id: userId },
        data: { status: 'expired' }
      });
    }

    const status = isExpired ? 'expired' : subscription.status;

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: {
          id: subscription.subscription_plans?.id,
          tier_name: subscription.subscription_plans?.subscription_tiers?.title,
          service_name: subscription.subscription_plans?.services?.name,
          service_type: subscription.subscription_plans?.service_type,
          discount_percentage: subscription.subscription_plans?.discount_percentage,
          free_visits_count: subscription.subscription_plans?.free_visits_count,
          duration_months: subscription.subscription_plans?.duration_months,
          price: subscription.subscription_plans?.price,
          currency: subscription.subscription_plans?.currency
        },
        free_visits_remaining: Math.max(0, 
          (subscription.subscription_plans?.free_visits_count || 0) - 
          (subscription.free_visits_used || 0)
        ),
        free_visits_used: subscription.free_visits_used || 0,
        expires_at: subscription.expires_at?.toISOString(),
        status: status
      }
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}