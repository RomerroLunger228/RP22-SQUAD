// Простой тест нового алгоритма
const { 
    timeToMinutes, 
    minutesToTime, 
    calculateOptimalSlots 
} = require('./lib/booking-utils.ts');

console.log("🧪 Тестируем новый алгоритм оптимального заполнения\n");

// Тест 1: Пустой день
console.log("=== ТЕСТ 1: Пустой день ===");
const workStart = "10:00:00";
const workEnd = "18:00:00";
const emptyDay = calculateOptimalSlots(workStart, workEnd, [], 60);
console.log("Услуга 60 мин, пустой день:");
console.log("Первые 5 слотов:", emptyDay.slice(0, 5));
console.log("Всего слотов:", emptyDay.length);

// Тест 2: День с записями
console.log("\n=== ТЕСТ 2: День с существующими записями ===");
const appointments = [
    { time: "11:00:00", duration: 60 }, // 11:00-12:00
    { time: "14:00:00", duration: 45 }  // 14:00-14:45
];

const busyDay = calculateOptimalSlots(workStart, workEnd, appointments, 80);
console.log("Услуга 80 мин, есть записи 11:00-12:00 и 14:00-14:45:");
console.log("Доступные слоты:", busyDay.slice(0, 8));

// Тест 3: Сравнение с маленькой услугой
console.log("\n=== ТЕСТ 3: Маленькая услуга (30 мин) ===");
const shortService = calculateOptimalSlots(workStart, workEnd, appointments, 30);
console.log("Услуга 30 мин:");
console.log("Первые 10 слотов:", shortService.slice(0, 10));

console.log("\n✅ Тест завершен!");