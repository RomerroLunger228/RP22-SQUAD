import { prisma } from '@/lib/prisma';

export interface RevenueStats {
  // Доходы от услуг
  servicesRevenue: number;           // Фактический доход от оказанных услуг
  servicesPotentialRevenue: number;  // Потенциальный доход без скидок
  servicesLoss: number;              // Потери от скидок и бесплатных визитов
  
  // Доходы от подписок  
  subscriptionsRevenue: number;      // Доходы от продажи подписок
  
  // Итого
  totalRevenue: number;              // Общий доход (услуги + подписки)
  netProfit: number;                 // Чистая прибыль (доходы - потери)
  
  // Статистика
  totalAppointments: number;         // Всего записей
  freeAppointments: number;          // Бесплатных записей (подписка)
  discountedAppointments: number;    // Записей со скидкой
  couponAppointments: number;        // 🎁 Записей по купонам
  regularAppointments: number;       // Обычных записей
}

export async function calculateRevenueStats(
  startDate?: Date, 
  endDate?: Date
): Promise<RevenueStats> {
  // Фильтр по датам для записей
  // appointment_date - это DateTime @db.Date, поэтому нужен полный DateTime
  const dateFilter = startDate && endDate ? {
    appointment_date: {
      gte: startDate, // Полный DateTime объект
      lte: endDate
    }
  } : {};

  // Получаем все завершенные записи
  const appointments = await prisma.appointments.findMany({
    where: {
      status: 'completed',
      ...dateFilter
    },
    include: {
      services: true
    }
  });

  // Получаем подписки которые были активны в период или активированы в период
  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(startDate && endDate ? {
        // Подписки которые начались в этот период ИЛИ были активны в этот период
        OR: [
          // Начались в период
          {
            started_at: {
              gte: startDate,
              lte: endDate
            }
          },
          
        ]
      } : {}),
      // Только активные или завершённые подписки (не отменённые)
      status: {
        in: ['active', 'completed']
      }
    },
    include: {
      subscription_plans: true
    }
  });

  // Расчет доходов от услуг
  let servicesRevenue = 0;
  let servicesPotentialRevenue = 0;
  let freeCount = 0;
  let discountCount = 0;
  let couponCount = 0;  // 🎁 Новый счетчик купонов
  let regularCount = 0;

  appointments.forEach(appointment => {
    // Фактический доход
    servicesRevenue += appointment.final_price_charged || 0;
    
    // Потенциальный доход
    const originalPrice = appointment.original_service_price || appointment.services.pl_price;
    servicesPotentialRevenue += originalPrice;
    
    // 🎁 Статистика по типам записей с обработкой купонов
    if (appointment.subscription_benefit_type === 'coupon' || appointment.payment_method === 'coupon') {
      couponCount++;
    } else if (appointment.subscription_benefit_type === 'free') {
      freeCount++;
    } else if (appointment.subscription_benefit_type === 'discount') {
      discountCount++;
    } else {
      regularCount++;
    }
  });

  // Расчет доходов от подписок
  const subscriptionsRevenue = subscriptions.reduce((sum, sub) => 
    sum + (sub.subscription_plans?.price || 0), 0
  );

  // Расчет потерь
  const servicesLoss = servicesPotentialRevenue - servicesRevenue;
  
  // Итоговые расчеты
  const totalRevenue = servicesRevenue + subscriptionsRevenue;
  const netProfit = totalRevenue - servicesLoss;

  return {
    servicesRevenue,
    servicesPotentialRevenue,
    servicesLoss,
    subscriptionsRevenue,
    totalRevenue,
    netProfit,
    totalAppointments: appointments.length,
    freeAppointments: freeCount,
    discountedAppointments: discountCount,
    couponAppointments: couponCount,  // 🎁 Добавляем статистику купонов
    regularAppointments: regularCount
  };
}

export async function getRevenueByPeriod(period: 'today' | 'week' | 'month' | 'year'): Promise<RevenueStats> {
  // Получаем сегодняшний день в польской временной зоне
  const nowUTC = new Date();
  const todayInPoland = nowUTC.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' });
  console.log('=== REVENUE PERIOD DEBUG ===');
  console.log('UTC now:', nowUTC.toISOString());
  console.log('Today in Poland:', todayInPoland);
  
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'today':
      // Сегодня: фильтруем записи за сегодняшнюю дату по польскому времени
      // Но используем UTC границы дня
      const [day, month, year] = todayInPoland.split('.').map(Number);
      
      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      
      console.log('TODAY FILTER:');
      console.log('StartDate UTC:', startDate.toISOString());
      console.log('EndDate UTC:', endDate.toISOString());
      break;
    case 'week':
      // Эта неделя: с понедельника по воскресенье в польском времени
      const [todayDay, todayMonth, todayYear] = todayInPoland.split('.').map(Number);
      const today = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay, 12, 0, 0)); // полдень для точности
      
      const dayOfWeek = today.getUTCDay(); // 0 = воскресенье, 1 = понедельник
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // дней до понедельника
      
      // Понедельник этой недели
      const mondayOfWeek = new Date(today);
      mondayOfWeek.setUTCDate(today.getUTCDate() - daysToMonday);
      
      // Воскресенье этой недели  
      const sundayOfWeek = new Date(mondayOfWeek);
      sundayOfWeek.setUTCDate(mondayOfWeek.getUTCDate() + 6);
      
      startDate = new Date(Date.UTC(mondayOfWeek.getUTCFullYear(), mondayOfWeek.getUTCMonth(), mondayOfWeek.getUTCDate(), 0, 0, 0, 0));
      endDate = new Date(Date.UTC(sundayOfWeek.getUTCFullYear(), sundayOfWeek.getUTCMonth(), sundayOfWeek.getUTCDate(), 23, 59, 59, 999));
      
      console.log('WEEK FILTER:');
      console.log('Monday:', mondayOfWeek.toISOString().split('T')[0]);
      console.log('Sunday:', sundayOfWeek.toISOString().split('T')[0]);
      console.log('StartDate UTC:', startDate.toISOString());
      console.log('EndDate UTC:', endDate.toISOString());
      break;
    case 'month':
      // Этот месяц: с 1 числа по последний день месяца в польском времени
      const [, monthMonth, monthYear] = todayInPoland.split('.').map(Number);
      
      startDate = new Date(Date.UTC(monthYear, monthMonth - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(monthYear, monthMonth, 0, 23, 59, 59, 999)); // последний день месяца
      
      console.log('MONTH FILTER:');
      console.log('Month:', monthMonth, 'Year:', monthYear);
      console.log('StartDate UTC:', startDate.toISOString());
      console.log('EndDate UTC:', endDate.toISOString());
      break;
    case 'year':
      // Этот год: с 1 января по 31 декабря в польском времени
      const [, , yearYear] = todayInPoland.split('.').map(Number);
      
      startDate = new Date(Date.UTC(yearYear, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(yearYear, 11, 31, 23, 59, 59, 999));
      
      console.log('YEAR FILTER:');
      console.log('Year:', yearYear);
      console.log('StartDate UTC:', startDate.toISOString());
      console.log('EndDate UTC:', endDate.toISOString());
      break;
  }

  return calculateRevenueStats(startDate, endDate);
}

export function formatRevenue(amount: number): string {
  return `${amount.toLocaleString('pl-PL')} PLN`;
}

export function calculateROI(subscriptionsRevenue: number, servicesLoss: number): number {
  if (servicesLoss === 0) return 100;
  return Math.round(((subscriptionsRevenue - servicesLoss) / servicesLoss) * 100);
}