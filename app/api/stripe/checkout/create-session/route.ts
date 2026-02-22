import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { calculateAppointmentPrice } from '@/lib/subscription-utils';
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

    const { serviceId, appointmentData } = await request.json();

    console.log('Create session request:', { serviceId, appointmentData, userId: authenticatedUserId });

    if (!serviceId || !appointmentData) {
      return NextResponse.json(
        { error: 'Service ID and appointment data are required' },
        { status: 400 }
      );
    }

    const service = await prisma.services.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (!service.stripe_price_id) {
      return NextResponse.json(
        { error: 'Service stripe price not configured' },
        { status: 400 }
      );
    }

    // Calculate subscription pricing - keep existing logic, just add discounts
    const discounts = [];
    let priceCalculation = null;
    
    try {
      priceCalculation = await calculateAppointmentPrice(authenticatedUserId, serviceId);
      
      if (priceCalculation.type === 'discount' && priceCalculation.discountAmount) {
        const coupon = await stripe.coupons.create({
          amount_off: priceCalculation.discountAmount * 100,
          currency: 'pln', 
          duration: 'once'
        });
        discounts.push({ coupon: coupon.id });
      }
    } catch (error) {
      console.error('Error calculating subscription price:', error);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: service.stripe_price_id,
          quantity: 1,
        },
      ],
      discounts,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        // Сохраняем данные для создания appointment после успешной оплаты
        appointmentData: JSON.stringify(appointmentData),
        userId: authenticatedUserId.toString(),
        serviceId: serviceId.toString(),
        priceCalculation: priceCalculation ? JSON.stringify(priceCalculation) : null
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}