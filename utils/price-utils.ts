export interface AppointmentWithService {
  final_price_charged?: number | null;
  payment_method?: string | null;
  original_service_price?: number | null;
  service: {
    pl_price: number;
  };
}

export function formatAppointmentPrice(appointment: AppointmentWithService): {
  displayText: string;
  originalPrice?: number;
} {
  // 🎁 Если это посещение по купону
  if (appointment.payment_method === 'coupon') {
    return {
      displayText: 'Free (Coupon)',
      originalPrice: appointment.original_service_price || appointment.service.pl_price
    };
  }

  // Если это посещение по подписке
  if (appointment.payment_method === 'subscription') {
    return {
      displayText: 'Free (Subscription)',
      originalPrice: appointment.original_service_price || appointment.service.pl_price
    };
  }

  // Иначе показываем итоговую цену или базовую цену
  const finalPrice = appointment.final_price_charged ?? appointment.service.pl_price;
  return {
    displayText: `${finalPrice} PLN`
  };
}

export function getAppointmentRevenue(appointment: AppointmentWithService): number {
  // 🎁 Явная обработка купонов - они всегда дают 0 дохода
  if (appointment.payment_method === 'coupon') {
    return 0;
  }
  
  // Для остальных способов оплаты используем final_price_charged или базовую цену
  return appointment.final_price_charged ?? appointment.service.pl_price;
}