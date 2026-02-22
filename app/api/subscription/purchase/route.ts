import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    const authenticatedUserId = await getCurrentUserId(request);
    
    if (!authenticatedUserId) {
      return createUnauthorizedResponse();
    }

    const { planId } = await request.json();

    console.log('Subscription purchase request:', { planId, userId: authenticatedUserId });

    if (!planId) {
      console.log('Missing required fields:', { planId });
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Проверяем, что у пользователя нет активной подписки
    const existingSubscription = await prisma.subscription.findUnique({
      where: { user_id: authenticatedUserId },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      const isExpired = existingSubscription.expires_at ? 
        new Date() > existingSubscription.expires_at : false;
      
      if (!isExpired) {
        return NextResponse.json(
          { error: 'User already has an active subscription' },
          { status: 400 }
        );
      }
    }

    // Получаем план подписки
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId },
      include: {
        subscription_tiers: true,
        services: true
      }
    });

    console.log('Subscription plan found:', plan);

    if (!plan) {
      console.log('Subscription plan not found for ID:', planId);
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    if (!plan.stripe_price_id) {
      console.log('Plan stripe_price_id not configured:', planId);
      return NextResponse.json(
        { error: 'Plan stripe price not configured' },
        { status: 400 }
      );
    }

    
    // Создаем Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      metadata: {
        type: 'subscription',
        planId: planId.toString(),
        userId: authenticatedUserId.toString(),
      },
    });

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}