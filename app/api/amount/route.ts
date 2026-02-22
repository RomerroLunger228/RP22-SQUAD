import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [appointmentsCount, commentsCount] = await Promise.all([
      prisma.appointments.count(),
      prisma.comments.count()
    ])
    
    
    return NextResponse.json({appointmentsCount, commentsCount}, {status: 200});
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments count' }, 
      { status: 500 }
    );
  }
}

