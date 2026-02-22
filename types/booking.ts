// types/booking.ts
export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  pl_price: number;
  usdt_price?: number;
  ton_price?: number;
  category_id?: number;
  category_name?: string;
  duration?: number; // Альтернативное поле для обратной совместимости
}

export interface BookingSlot {
  date: Date;        // Дата записи
  time: string;      // Время в формате "14:30:00"
  slot: string;      // Форматированное время "14:30"
}

export interface BookingData {
  service: Service | null;
  date: Date | null;
  timeSlot: string | null;  // Время в формате "14:30:00"
  formattedTime?: string;   // "14:30" для отображения
  formattedDate?: string;   // "30 декабря 2025" для отображения
}

export enum BookingStep {
  SERVICE_SELECTION = 1,
  DATE_TIME_SELECTION = 2,
  CONFIRMATION = 3,
}