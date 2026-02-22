// lib/booking-utils.ts
/**
 * Утилиты для расчета временных слотов
 * Все время в формате "HH:MM:SS"
 */

export function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

export function generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number
): string[] {
    const slots: string[] = [];
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    
    for (let time = start; time < end; time += intervalMinutes) {
        slots.push(minutesToTime(time));
    }
    
    return slots;
}

export function timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    
    return !(e1 <= s2 || s1 >= e2);
}

/**
 * НОВЫЙ АЛГОРИТМ ОПТИМАЛЬНОГО ЗАПОЛНЕНИЯ ДНЯ (замена старого)
 * Этап 1: Находит все возможные слоты с буфером 5 минут
 * Этап 2: Сортирует по приоритету оптимального заполнения
 */
export function calculateOptimalSlots(
    workStart: string,
    workEnd: string,
    appointments: Array<{
        time: string;
        duration: number;
    }>,
    serviceDuration: number,
    buffer: number = 5,
    stepMinutes: number = 5,
    blockedTimes: Array<{start_time: string, end_time: string}> = []
): string[] {

    const workStartMinutes = timeToMinutes(workStart);
    const workEndMinutes = timeToMinutes(workEnd);
    
    // Подготавливаем отсортированные записи с буферами
    const sortedAppointments = [...appointments]
        .filter(app => app.time)
        .map(app => ({
            start: timeToMinutes(app.time) - buffer,
            end: timeToMinutes(app.time) + app.duration + buffer
        }))
        .sort((a, b) => a.start - b.start);


    // Этап 1: Найти все физически возможные слоты
    const allPossibleSlots: Array<{time: string, priority: number}> = [];

    for (let currentMinutes = workStartMinutes; currentMinutes <= workEndMinutes - serviceDuration; currentMinutes += stepMinutes) {
        const slotEndMinutes = currentMinutes + serviceDuration;
        
        // Проверяем пересечения с записями
        let hasConflict = false;
        for (const appointment of sortedAppointments) {
            if (!(slotEndMinutes <= appointment.start || currentMinutes >= appointment.end)) {
                hasConflict = true;
                break;
            }
        }

        // Проверяем пересечения с заблокированными временами
        if (!hasConflict) {
            for (const blocked of blockedTimes) {
                const slotTime = minutesToTime(currentMinutes);
                const slotEndTime = minutesToTime(slotEndMinutes);
                if (timeRangesOverlap(slotTime, slotEndTime, blocked.start_time, blocked.end_time)) {
                    hasConflict = true;
                    break;
                }
            }
        }

        if (!hasConflict) {
            const priority = calculateSlotPriority(currentMinutes, slotEndMinutes, sortedAppointments, workStartMinutes, workEndMinutes, serviceDuration);
            allPossibleSlots.push({
                time: minutesToTime(currentMinutes),
                priority
            });
        }
    }

    // Этап 2: Сортируем по приоритету (меньше = лучше)
    allPossibleSlots.sort((a, b) => a.priority - b.priority);
    
    
    // Этап 3: Применяем умную фильтрацию
    const hasAppointments = appointments.length > 0;
    const filteredSlots = filterOptimalSlots(allPossibleSlots, workStart, workEnd, serviceDuration, hasAppointments);
    
    
    return filteredSlots;
}

/**
 * РАСЧЕТ ПРИОРИТЕТА СЛОТА (меньше = лучше)
 * 1. Начало дня - высший приоритет
 * 2. Сразу после записей - второй приоритет  
 * 3. Заполнение небольших окон - третий приоритет
 * 4. Оставляющие большие пропуски - низший приоритет
 */
function calculateSlotPriority(
    slotStart: number,
    slotEnd: number,
    appointments: Array<{start: number, end: number}>,
    workStart: number,
    workEnd: number,
    serviceDuration: number
): number {
    // Приоритет 1: Начало рабочего дня
    if (slotStart === workStart) {
        return 1;
    }

    // Приоритет 2: Сразу после записи (плотная упаковка)
    for (const app of appointments) {
        if (Math.abs(slotStart - app.end) <= 10) { // в пределах 10 минут после записи
            return 2;
        }
    }

    // Приоритет 3: Заполняет небольшое окно между записями
    for (let i = 0; i < appointments.length - 1; i++) {
        const currentEnd = appointments[i].end;
        const nextStart = appointments[i + 1].start;
        const gapSize = nextStart - currentEnd;
        
        if (slotStart >= currentEnd && slotEnd <= nextStart) {
            return gapSize < 60 ? 3 : 4; // маленькое окно лучше большого
        }
    }

    // Приоритет 4: Идеальный слот в конце дня (услуга заканчивается точно в конце работы)
    const idealEndSlot = workEnd - serviceDuration;
    if (Math.abs(slotStart - idealEndSlot) <= 5) {
        // Дополнительная проверка: слот должен быть в последних 2 часах дня
        if (slotStart >= workEnd - 120) {
            return 4;
        }
    }

    // Приоритет 5: Остальные слоты в конце дня (последние 2 часа)
    if (slotStart >= workEnd - 120) { 
        return 5;
    }

    // Приоритет 5: Все остальные случаи
    return 6;
}

/**
 * УМНАЯ ФИЛЬТРАЦИЯ СЛОТОВ ПО ОПТИМАЛЬНОЙ СТРАТЕГИИ
 * Пустой день: начало + конец + целые часы
 * День с записями: начало + после записей + заполнение окон + конец
 */
export function filterOptimalSlots(
    allSlots: Array<{time: string, priority: number}>,
    workStart: string,
    workEnd: string,
    serviceDuration: number,
    hasAppointments: boolean = false
): string[] {

    if (!hasAppointments) {
        // СТРАТЕГИЯ ДЛЯ ПУСТОГО ДНЯ
        return filterEmptyDaySlots(allSlots, workStart, workEnd, serviceDuration);
    } else {
        // СТРАТЕГИЯ ДЛЯ ДНЯ С ЗАПИСЯМИ  
        return filterBusyDaySlots(allSlots, workStart, workEnd);
    }
}

/**
 * ФИЛЬТРАЦИЯ ДЛЯ ПУСТОГО ДНЯ
 * Логика: начало + конец + целые часы между ними
 */
function filterEmptyDaySlots(
    allSlots: Array<{time: string, priority: number}>,
    workStart: string,
    workEnd: string,
    serviceDuration: number
): string[] {
    
    const filteredSlots: string[] = [];
    const workStartMinutes = timeToMinutes(workStart);
    const workEndMinutes = timeToMinutes(workEnd);
    
    // 1. НАЧАЛО ДНЯ (всегда первый)
    const startSlot = allSlots.find(slot => timeToMinutes(slot.time) === workStartMinutes);
    if (startSlot) {
        filteredSlots.push(startSlot.time);
    }
    
    // 2. ИДЕАЛЬНЫЙ КОНЕЦ ДНЯ (услуга заканчивается точно в конце рабочего дня)
    const idealEndMinutes = workEndMinutes - serviceDuration;
    const endSlot = allSlots.find(slot => 
        Math.abs(timeToMinutes(slot.time) - idealEndMinutes) <= 5
    );
    if (endSlot && endSlot.time !== startSlot?.time) {
        filteredSlots.push(endSlot.time);
    }
    
    // 3. ЦЕЛЫЕ ЧАСЫ МЕЖДУ НАЧАЛОМ И КОНЦОМ
    const startHour = Math.ceil(workStartMinutes / 60) * 60; // следующий целый час после начала
    const endHour = Math.floor(idealEndMinutes / 60) * 60;   // последний целый час до конца
    
    const wholeHourSlots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour += 60) {
        const hourSlot = allSlots.find(slot => timeToMinutes(slot.time) === hour);
        if (hourSlot && !filteredSlots.includes(hourSlot.time)) {
            wholeHourSlots.push(hourSlot.time);
        }
    }
    
    // Берем максимум 3-4 целых часа
    const selectedWholeHours = wholeHourSlots.slice(0, 4);
    filteredSlots.push(...selectedWholeHours);
    
    
    return filteredSlots;
}

/**
 * ФИЛЬТРАЦИЯ ДЛЯ ДНЯ С ЗАПИСЯМИ
 * Логика: начало + после записей + целые часы в окнах + конец
 */
function filterBusyDaySlots(
    allSlots: Array<{time: string, priority: number}>,
    workStart: string,
    workEnd: string
): string[] {
    
    const filteredSlots: string[] = [];
    const workStartMinutes = timeToMinutes(workStart);
    
    // 1. НАЧАЛО ДНЯ (если есть место до первой записи)
    const startSlot = allSlots.find(slot => timeToMinutes(slot.time) === workStartMinutes);
    if (startSlot) {
        filteredSlots.push(startSlot.time);
    }
    
    // 2. СРАЗУ ПОСЛЕ ЗАПИСЕЙ (приоритет 2) - только первый из каждой группы
    const afterAppointments = allSlots.filter(slot => slot.priority === 2);
    
    // Берем только первый слот после каждой записи, избегаем соседних
    const uniqueAfterSlots: string[] = [];
    afterAppointments.forEach(slot => {
        const slotMinutes = timeToMinutes(slot.time);
        const hasNearbySlot = uniqueAfterSlots.some(existingSlot => 
            Math.abs(timeToMinutes(existingSlot) - slotMinutes) < 20 // менее 20 минут разницы
        );
        
        if (!hasNearbySlot && uniqueAfterSlots.length < 2) {
            uniqueAfterSlots.push(slot.time);
        }
    });
    
    uniqueAfterSlots.forEach(slotTime => {
        if (!filteredSlots.includes(slotTime)) {
            filteredSlots.push(slotTime);
        }
    });
    
    // 3. ЦЕЛЫЕ ЧАСЫ В БОЛЬШИХ ПРОМЕЖУТКАХ
    const wholeHourSlots: string[] = [];
    for (let hour = Math.ceil(workStartMinutes / 60) * 60; hour < timeToMinutes(workEnd); hour += 60) {
        const hourSlot = allSlots.find(slot => timeToMinutes(slot.time) === hour);
        if (hourSlot && !filteredSlots.includes(hourSlot.time)) {
            wholeHourSlots.push(hourSlot.time);
        }
    }
    
    // Берем максимум 3 целых часа
    const selectedWholeHours = wholeHourSlots.slice(0, 3);
    filteredSlots.push(...selectedWholeHours);
    
    // 4. ИДЕАЛЬНЫЙ КОНЕЦ ДНЯ (приоритет 4) - только если действительно в конце
    const idealEnd = allSlots.find(slot => slot.priority === 4);
    if (idealEnd && !filteredSlots.includes(idealEnd.time)) {
        const idealEndMinutes = timeToMinutes(idealEnd.time);
        const workEndMinutes = timeToMinutes(workEnd);
        
        // Проверяем что это действительно в конце дня (в последних 2 часах)
        if (idealEndMinutes >= workEndMinutes - 120) {
            // Дополнительно проверяем близость к уже добавленным слотам
            const isTooClose = filteredSlots.some(existingSlot => 
                Math.abs(timeToMinutes(existingSlot) - idealEndMinutes) < 20
            );
            
            if (!isTooClose) {
                filteredSlots.push(idealEnd.time);
            } else {
            }
        } else {
        }
    }
    
    // 5. ДОПОЛНИТЕЛЬНЫЕ СЛОТЫ ИЗ МАЛЕНЬКИХ ОКОН (приоритет 3)
    const smallGaps = allSlots.filter(slot => slot.priority === 3);
    smallGaps.slice(0, 2).forEach(slot => {
        // Проверяем что слот не близко к уже добавленным
        const slotMinutes = timeToMinutes(slot.time);
        const isTooClose = filteredSlots.some(existingSlot => 
            Math.abs(timeToMinutes(existingSlot) - slotMinutes) < 20
        );
        
        if (!filteredSlots.includes(slot.time) && !isTooClose && filteredSlots.length < 8) {
            filteredSlots.push(slot.time);
        } else if (isTooClose) {
        }
    });

    return filteredSlots;
}