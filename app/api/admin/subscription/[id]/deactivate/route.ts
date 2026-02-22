import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminJWT, createAdminForbiddenResponse } from '@/lib/admin-auth';
import '@/lib/bigint-json';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем что пользователь - админ
    const admin = await requireAdminJWT(request);
    
    if (!admin) {
      return createAdminForbiddenResponse();
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await prisma.subscription.delete({
      where: { id: subscriptionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}