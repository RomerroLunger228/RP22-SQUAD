import { NextRequest, NextResponse } from 'next/server';
import { calculateAppointmentPrice } from '@/lib/subscription-utils';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    const authenticatedUserId = await getCurrentUserId(request);
    
    if (!authenticatedUserId) {
      return createUnauthorizedResponse();
    }

    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    const priceCalculation = await calculateAppointmentPrice(
      authenticatedUserId,
      parseInt(serviceId)
    );

    return NextResponse.json(priceCalculation);
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}