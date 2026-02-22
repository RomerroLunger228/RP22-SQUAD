import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AppointmentDebug {
  id: number;
  appointment_date: Date;
  time: unknown;
  status: string | null;
  payment_status: string | null;
  final_price_charged: number | null;
  original_service_price: number | null;
  subscription_benefit_type: string | null;
  services?: {
    name: string;
    pl_price: number;
    haircut_categories?: {
      name: string;
    } | null;
  } | null;
}

export async function GET() {
  try {
    // Получаем все записи за последние 7 дней для контекста
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentAppointments = await prisma.appointments.findMany({
      where: {
        appointment_date: {
          gte: weekAgo
        }
      },
      include: {
        services: {
          include: {
            haircut_categories: true
          }
        }
      },
      orderBy: [
        { appointment_date: 'desc' },
        { time: 'desc' }
      ]
    });

    console.log('=== RECENT APPOINTMENTS DEBUG ===');
    console.log('Total found:', recentAppointments.length);

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = recentAppointments.filter((apt: AppointmentDebug) => {
      const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
      return aptDate === today;
    });

    console.log('Today appointments:', todayAppointments.length);
    console.log('Today date string:', today);
    


    const response = {
      today: today,
      todayCount: todayAppointments.length,
      totalRecentCount: recentAppointments.length,
      todayAppointments: todayAppointments.map((apt: AppointmentDebug) => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.time,
        status: apt.status,
        service: apt.services?.name,
        category: apt.services?.haircut_categories?.name,
        originalPrice: apt.original_service_price,
        finalPrice: apt.final_price_charged,
        servicePrice: apt.services?.pl_price,
        benefitType: apt.subscription_benefit_type
      })),
      allRecent: recentAppointments.map((apt: AppointmentDebug) => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.time,
        status: apt.status,
        service: apt.services?.name,
        finalPrice: apt.final_price_charged || apt.services?.pl_price
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Debug appointments error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}