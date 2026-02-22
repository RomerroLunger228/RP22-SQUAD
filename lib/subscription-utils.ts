import { prisma } from '@/lib/prisma';

interface SubscriptionWithRelations {
  id: bigint;
  user_id: number;
  plan_id: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  started_at: Date | null;
  expires_at: Date | null;
  created_at: Date | null;
  free_visits_used: number | null;
  subscription_plans: {
    id: number;
    tier_id: number;
    duration_months: number | null;
    price: number | null;
    currency: string | null;
    stripe_price_id: string | null;
    code: string | null;
    service_type: string | null;
    discount_percentage: number | null;
    free_visits_count: number | null;
    service_id: number | null;
    services: unknown[];
    subscription_tiers: {
      id: number;
      title: string | null;
      description: string | null;
      priority: number | null;
    };
  } | null;
}

export interface SubscriptionBenefit {
  type: 'full' | 'free' | 'discount' | 'coupon';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  couponId?: number;
}

export async function getActiveUserSubscription(userId: number) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
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
      return null;
    }

    // Check if subscription is expired
    const isExpired = subscription.expires_at ? new Date() > subscription.expires_at : false;
    
    if (isExpired) {
      // Update status to expired
      await prisma.subscription.update({
        where: { user_id: userId },
        data: { status: 'expired' }
      });
      return null;
    }

    if (subscription.status !== 'active') {
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error getting active user subscription:', error);
    return null;
  }
}

export async function canUseSubscription(userId: number, serviceId: number): Promise<boolean> {
  try {
    const subscription = await getActiveUserSubscription(userId);
    
    if (!subscription || !subscription.subscription_plans) {
      return false;
    }

    const plan = subscription.subscription_plans;
    
    // Проверяем точное соответствие service_id
    // Подписка действует ТОЛЬКО на конкретную услугу, указанную в plan.service_id
    return plan.service_id === serviceId;
  } catch (error) {
    console.error('Error checking if can use subscription:', error);
    return false;
  }
}

export async function calculateAppointmentPrice(userId: number, serviceId: number): Promise<SubscriptionBenefit> {
  try {
    const service = await prisma.services.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const originalPrice = service.pl_price;
    
    // 🎁 ПРИОРИТЕТ 1: Проверяем купоны первыми
    const availableCoupon = await prisma.coupons.findFirst({
      where: {
        user_id: userId,
        is_used: false
      }
    });

    if (availableCoupon) {
      return {
        type: 'coupon',
        price: 0,
        originalPrice,
        discountAmount: originalPrice,
        couponId: availableCoupon.id
      };
    }
    
    // 🔄 ПРИОРИТЕТ 2: Проверяем подписку
    const canUse = await canUseSubscription(userId, serviceId);
    if (!canUse) {
      return {
        type: 'full',
        price: originalPrice
      };
    }

    const subscription = await getActiveUserSubscription(userId);
    if (!subscription || !subscription.subscription_plans) {
      return {
        type: 'full',
        price: originalPrice
      };
    }

    const plan = subscription.subscription_plans;
    const freeVisitsUsed = subscription.free_visits_used || 0;
    const freeVisitsAvailable = plan.free_visits_count || 0;

    // Check if user can use free visit
    if (freeVisitsUsed < freeVisitsAvailable) {
      return {
        type: 'free',
        price: 0,
        originalPrice
      };
    }

    // Apply discount
    const discountPercentage = plan.discount_percentage || 0;
    const discountAmount = Math.round(originalPrice * discountPercentage / 100);
    const discountedPrice = originalPrice - discountAmount;

    return {
      type: 'discount',
      price: discountedPrice,
      originalPrice,
      discountAmount
    };
  } catch (error) {
    console.error('Error calculating appointment price:', error);
    throw error;
  }
}

export async function useSubscriptionBenefit(userId: number, type: 'free' | 'discount'): Promise<void> {
  try {
    if (type === 'free') {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId }
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { user_id: userId },
          data: {
            free_visits_used: (subscription.free_visits_used || 0) + 1
          }
        });
      }
    }
    // For discount type, no state needs to be updated
  } catch (error) {
    console.error('Error using subscription benefit:', error);
    throw error;
  }
}

export function isSubscriptionExpired(subscription: SubscriptionWithRelations): boolean {
  if (!subscription || !subscription.expires_at) {
    return true;
  }
  
  return new Date() > new Date(subscription.expires_at);
}

