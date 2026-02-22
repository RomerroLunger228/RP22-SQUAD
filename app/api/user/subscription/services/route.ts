import { NextRequest, NextResponse } from 'next/server';
import { getActiveUserSubscription } from '@/lib/subscription-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const subscription = await getActiveUserSubscription(Number(userId));
    
    if (!subscription?.subscription_plans) {
      return NextResponse.json({ 
        hasSubscription: false, 
        serviceId: null, 
        tier: null 
      });
    }

    const plan = subscription.subscription_plans;
    const isPremuim = plan.subscription_tiers?.title?.toLowerCase().includes('premium');
    
    return NextResponse.json({
      hasSubscription: true,
      serviceId: plan.service_id,
      tier: isPremuim ? 'premium' : 'default'
    });

  } catch (error) {
    console.error('Error getting user subscription services:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription info' }, 
      { status: 500 }
    );
  }
}