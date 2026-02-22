import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { parseTimeToUTC } from '@/lib/date-utils';
import { notifyAdminAboutNewAppointment } from '@/lib/telegram-utils';
import { NotificationContext } from '@/types/notifications';

interface AppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  paymentMethod: string;
}

interface PriceCalculation {
  type?: string;
  price?: number;
  originalPrice?: number;
  discountAmount?: number;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  try {
    console.log('Webhook event received:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Session completed:', {
          id: session.id,
          payment_status: session.payment_status,
          metadata: session.metadata,
          payment_intent: session.payment_intent
        });
        
        if (session.payment_status === 'paid') {
          // Check if this is a subscription purchase
          if (session.metadata?.type === 'subscription') {
            const planId = parseInt(session.metadata.planId || '0');
            const userId = parseInt(session.metadata.userId || '0');
            
            console.log('Processing subscription purchase:', { planId, userId });
            
            if (planId && userId) {
              await createSubscription(planId, userId, session);
            } else {
              console.log('Invalid plan ID or user ID from metadata');
            }
          } else {
            // Handle regular appointment payment - create appointment after successful payment
            const appointmentDataStr = session.metadata?.appointmentData;
            const userId = parseInt(session.metadata?.userId || '1');
            const serviceId = parseInt(session.metadata?.serviceId || '0');
            const priceCalculationStr = session.metadata?.priceCalculation;
            
            console.log('Processing payment for new appointment:', { userId, serviceId });
            
            if (appointmentDataStr && serviceId) {
              try {
                const appointmentData = JSON.parse(appointmentDataStr);
                const priceCalculation = priceCalculationStr ? JSON.parse(priceCalculationStr) : null;
                
                // Создаем appointment только после успешной оплаты
                const appointment = await createAppointmentAfterPayment(
                  appointmentData, 
                  userId, 
                  serviceId, 
                  priceCalculation, 
                  session
                );
                console.log('Appointment created after payment:', appointment);
              } catch (error) {
                console.error('Error parsing appointment data:', error);
              }
            } else {
              // Fallback для старой логики - обновляем существующий appointment
              const appointmentId = parseInt(session.metadata?.appointmentId || '0');
              if (appointmentId) {
                const updatedAppointment = await prisma.appointments.update({
                  where: { id: appointmentId },
                  data: {
                    payment_status: 'paid',
                    paid_at: new Date(),
                    stripe_payment_intent_id: session.payment_intent as string,
                  },
                });
                console.log('Appointment updated (legacy):', updatedAppointment);
              }
            }
          }
        } else {
          console.log('Payment not completed, status:', session.payment_status);
        }
        break;

      // case 'payment_intent.succeeded':
        
      //   const paymentIntent = event.data.object as Stripe.PaymentIntent;
      //   break;

      // case 'payment_intent.payment_failed':
      //   const failedPayment = event.data.object as Stripe.PaymentIntent;
      //   break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function createSubscription(planId: number, userId: number, session: Stripe.Checkout.Session) {
  try {
    // Get the subscription plan
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.duration_months) {
      console.error('Subscription plan not found or invalid:', planId);
      return;
    }

    // Calculate expiration date in Polish timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const startDate = new Date(formatter.format(now).replace(' ', 'T'));
    const expirationDate = new Date(startDate);
    expirationDate.setMonth(expirationDate.getMonth() + plan.duration_months);

    // Delete any existing subscription for this user
    await prisma.subscription.deleteMany({
      where: { user_id: userId }
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        plan_id: planId,
        stripe_customer_id: session.customer as string,
        status: 'active',
        started_at: startDate,
        expires_at: expirationDate,
        free_visits_used: 0
      }
    });

    console.log('Subscription created successfully:', subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

async function createAppointmentAfterPayment(
  appointmentData: AppointmentData, 
  userId: number, 
  serviceId: number, 
  priceCalculation: PriceCalculation, 
  session: Stripe.Checkout.Session
) {
  try {
    // Форматирование даты и времени
    const appointmentDateObj = new Date(appointmentData.appointmentDate + 'T12:00:00Z');
    const [hours, minutes] = appointmentData.appointmentTime.split(':').map(Number);
    const appointmentTimeObj = parseTimeToUTC(`${hours}:${minutes}`);
    
    // Рассчитываем финальную цену
    const finalPriceCharged = priceCalculation?.price || priceCalculation?.originalPrice || 0;
    
    const appointment = await prisma.appointments.create({
      data: {
        service_id: serviceId,
        user_id: userId,
        appointment_date: appointmentDateObj,
        time: appointmentTimeObj,
        payment_method: appointmentData.paymentMethod,
        status: 'pending',
        payment_status: 'paid',
        paid_at: new Date(),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        subscription_benefit_type: priceCalculation?.type === 'full' ? null : priceCalculation?.type,
        original_service_price: priceCalculation?.originalPrice,
        discount_amount: priceCalculation?.discountAmount,
        final_price_charged: finalPriceCharged
      }
    });
    if (appointment) {
          try {
            // Получаем данные для уведомления
            const appointmentWithDetails = await prisma.services.findUnique({
              where: { id: appointment.service_id },
              select: { name: true }
            });
    
            const user = await prisma.users.findUnique({
              where: { id: userId },
              select: { username: true }
            });
    
            if (appointmentWithDetails && user) {
              const notificationContext: NotificationContext = {
                appointmentId: appointment.id,
                userId: userId,
                serviceTitle: appointmentWithDetails.name,
                appointmentDate: appointmentDateObj.toISOString().split('T')[0], // Форматируем дату в YYYY-MM-DD
                appointmentTime: appointmentTimeObj.toISOString().split('T')[1].substring(0, 5), // Форматируем время в HH:MM
                userName: user.username
              };
    
              // Уведомляем админов (async, не блокируем ответ)
              notifyAdminAboutNewAppointment(notificationContext).catch(error => {
                console.error('Ошибка отправки уведомления админу:', error);
              });
            }
          } catch (error) {
            console.error('Ошибка подготовки уведомления:', error);
            // Не блокируем создание записи из-за ошибки уведомления
          }
        }

    // Обновляем счетчик подписки если применялась скидка (но не бесплатный визит)
    if (priceCalculation?.type === 'discount') {
      // Для скидок счетчики не обновляем - только записываем информацию о скидке
    }
    
    return appointment;
  } catch (error) {
    console.error('Error creating appointment after payment:', error);
    throw error;
  }
}