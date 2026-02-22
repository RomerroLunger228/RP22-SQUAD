import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, serviceId } = await request.json();

    console.log('Checkout create request:', { appointmentId, serviceId });

    if (!appointmentId || !serviceId) {
      console.log('Missing required fields:', { appointmentId, serviceId });
      return NextResponse.json(
        { error: 'appointment ID and service ID are required' },
        { status: 400 }
      );
    }

    const service = await prisma.services.findUnique({
      where: { id: serviceId },
    });

    console.log('Service found:', service);

    if (!service) {
      console.log('Service not found for ID:', serviceId);
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (!service.stripe_price_id) {
      console.log('Stripe price ID missing for service:', serviceId);
      return NextResponse.json(
        { error: 'Service does not have Stripe price ID configured' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prepare discount coupon if applicable
    const discounts = [];
    if (appointment.subscription_benefit_type === 'discount' && appointment.discount_amount) {
      // Create one-time coupon for this discount
      const coupon = await stripe.coupons.create({
        amount_off: appointment.discount_amount * 100, // Convert to cents
        currency: 'pln',
        duration: 'once'
      });
      discounts.push({ coupon: coupon.id });
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
        appointmentId: appointmentId.toString(),
        originalPrice: appointment.original_service_price?.toString() || service.pl_price.toString(),
        discountAmount: appointment.discount_amount?.toString() || '0',
        subscriptionBenefitType: appointment.subscription_benefit_type || 'none'
      },
    });

    await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        stripe_checkout_session_id: session.id,
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