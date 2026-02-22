/**
 * API для создания записей с Axios
 * Миграция с fetch на axios с полной типизацией
 */

import apiClient from '@/lib/axios';

interface AppointmentData {
    serviceId: number;
    appointmentDate: string;
    appointmentTime: string;
    paymentMethod: string;
}

interface AppointmentResponse {
    id: number;
    serviceId: number;
    appointmentDate: string;
    appointmentTime: string;
    paymentMethod: string;
    subscriptionBenefit?: {
        type: 'full' | 'free' | 'discount';
        price: number;
        originalPrice?: number;
        discountAmount?: number;
    };
}

// Импортируем типы
import { Appointment } from '@/types/admin';

interface StripeCheckoutData {
    serviceId: number;
    appointmentDate: string;
    appointmentTime: string;
    paymentMethod: 'card';
}

interface StripeCheckoutResponse {
    url: string;
    sessionId: string;
}

/**
 * Получает активные записи пользователя
 */
export async function getActiveAppointments(userId: number): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>(`/api/appointments?userId=${userId}&active=true`);
    return response.data;
}

/**
 * Создает Stripe checkout сессию
 */
export async function createStripeCheckout(data: StripeCheckoutData): Promise<StripeCheckoutResponse> {
    const payload = {
        serviceId: data.serviceId,
        appointmentData: {
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            paymentMethod: data.paymentMethod
        }
    };
    const response = await apiClient.post<StripeCheckoutResponse>('/api/stripe/checkout/create-session', payload);
    return response.data;
}

/**
 * Создает новую запись
 */
export async function createAppointment(data: AppointmentData): Promise<AppointmentResponse> {
    const response = await apiClient.post<AppointmentResponse>('/api/appointment/create', {
        data
    });
    return response.data;
}