/**
 * API для работы с услугами и доступными слотами
 * Миграция с fetch на axios с полной типизацией
 */

import apiClient from '@/lib/axios';
import { Service } from '@/types/booking';

interface AvailableSlot {
    time: string;
    available: boolean;
}

/**
 * Получает список всех услуг
 */
export async function fetchServices(): Promise<Service[]> {
    const response = await apiClient.get<Service[]>('/api/services/');
    return response.data;
}

/**
 * Получает доступные временные слоты для услуги
 */
export async function fetchAvailableSlots(
    serviceId: number, 
    date: string,
    workingHours?: { start_time: string; end_time: string }
): Promise<AvailableSlot[]> {
    const headers: Record<string, string> = {};
    
    // ⚡ ОПТИМИЗАЦИЯ: передаем рабочие часы в заголовке если доступны
    if (workingHours) {
        headers['x-working-hours'] = JSON.stringify({
            start_time: workingHours.start_time,
            end_time: workingHours.end_time,
            is_working: true
        });
    }

    const response = await apiClient.get<AvailableSlot[]>('/api/available', {
        params: {
            serviceId,
            date,
            slotInterval: 30,
            buffer: 15
        },
        headers
    });
    return response.data;
}