import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AppointmentRevenue {
  id: number;
  appointment_date: Date;
  status: string | null;
  final_price_charged: number | null;
  services?: {
    name: string;
    pl_price: number;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Логика для "сегодня" с польским временем
    const nowUTC = new Date();
    const nowInPoland = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Warsaw"}));
    
    const startDate = new Date(nowInPoland);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(nowInPoland);
    endDate.setHours(23, 59, 59, 999);

    console.log('=== DEBUG REVENUE FILTER WITH TIMEZONE ===');
    console.log('Now UTC:', nowUTC.toISOString());
    console.log('Now in Poland:', nowInPoland.toISOString());
    console.log('StartDate (Poland):', startDate.toISOString());
    console.log('EndDate (Poland):', endDate.toISOString());
    console.log('StartDate local date:', startDate.toLocaleDateString('pl-PL'));
    console.log('EndDate local date:', endDate.toLocaleDateString('pl-PL'));

    // Получаем все записи за сегодня
    const allAppointments = await prisma.appointments.findMany({
      where: {
        appointment_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        services: true
      },
      orderBy: {
        appointment_date: 'desc'
      }
    });

    console.log('=== ALL APPOINTMENTS FOR TODAY ===');
    allAppointments.forEach((apt: AppointmentRevenue, index: number) => {
      console.log(`${index + 1}. ID: ${apt.id}`);
      console.log(`   Date: ${apt.appointment_date}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Service: ${apt.services?.name}`);
      console.log(`   Price: ${apt.final_price_charged || apt.services?.pl_price}`);
      console.log('   ---');
    });

    // Получаем только завершенные
    const completedAppointments = await prisma.appointments.findMany({
      where: {
        status: 'completed',
        appointment_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        services: true
      }
    });

    console.log('=== COMPLETED APPOINTMENTS ONLY ===');
    completedAppointments.forEach((apt: AppointmentRevenue, index: number) => {
      console.log(`${index + 1}. ID: ${apt.id}, Status: ${apt.status}, Price: ${apt.final_price_charged || apt.services?.pl_price}`);
    });

    const response = {
      debug: {
        nowUTC: nowUTC.toISOString(),
        nowInPoland: nowInPoland.toISOString(),
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        startDateLocal: startDate.toLocaleDateString('pl-PL'),
        endDateLocal: endDate.toLocaleDateString('pl-PL'),
        totalAppointments: allAppointments.length,
        completedAppointments: completedAppointments.length,
        allStatuses: [...new Set(allAppointments.map((a: AppointmentRevenue) => a.status))]
      },
      appointments: allAppointments.map((apt: AppointmentRevenue) => ({
        id: apt.id,
        date: apt.appointment_date,
        status: apt.status,
        service: apt.services?.name,
        finalPrice: apt.final_price_charged,
        servicePrice: apt.services?.pl_price
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Debug revenue error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
}