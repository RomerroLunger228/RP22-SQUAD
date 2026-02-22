import { NextRequest, NextResponse } from 'next/server';
import { getRevenueByPeriod, calculateRevenueStats } from '@/lib/revenue-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('Received request for revenue stats with params:', Object.fromEntries(searchParams.entries()));
    const period = searchParams.get('period') as 'today' | 'week' | 'month' | 'year';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let stats;

    if (startDate && endDate) {
      // Кастомный период
      stats = await calculateRevenueStats(
        new Date(startDate), 
        new Date(endDate)
      );
    } else if (period) {
      // Предустановленный период
      stats = await getRevenueByPeriod(period);
    } else {
      // Все время
      stats = await calculateRevenueStats();
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating revenue stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate revenue stats' },
      { status: 500 }
    );
  }
}