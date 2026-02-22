import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminJWT, createAdminForbiddenResponse } from '@/lib/admin-auth';
import '@/lib/bigint-json';

export async function POST(request: NextRequest) {
  try {
    // Проверяем что пользователь - админ
    const admin = await requireAdminJWT(request);
    
    if (!admin) {
      return createAdminForbiddenResponse();
    }

    const { userId, planId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'User ID and Plan ID are required' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли у пользователя уже активная подписка
    const existingSubscription = await prisma.subscription.findUnique({
      where: { user_id: parseInt(userId) }
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Получаем план подписки
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: parseInt(planId) },
      include: {
        services: true,
        subscription_tiers: true
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Вычисляем дату истечения подписки
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan.duration_months || 1));

    // Создаем или обновляем подписку
    const subscription = existingSubscription 
      ? await prisma.subscription.update({
          where: { user_id: parseInt(userId) },
          data: {
            plan_id: plan.id,
            status: 'active',
            expires_at: expiresAt,
            free_visits_used: 0,
            started_at: new Date()
          },
          include: {
            subscription_plans: {
              include: {
                services: true,
                subscription_tiers: true
              }
            }
          }
        })
      : await prisma.subscription.create({
          data: {
            user_id: parseInt(userId),
            plan_id: plan.id,
            status: 'active',
            expires_at: expiresAt,
            free_visits_used: 0,
            started_at: new Date()
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

    return NextResponse.json({
      success: true,
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
        free_visits_remaining: subscription.subscription_plans?.free_visits_count || 0,
        free_visits_used: subscription.free_visits_used || 0,
        expires_at: subscription.expires_at?.toISOString(),
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}