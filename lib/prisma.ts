// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * 🚀 АРХИТЕКТУРНОЕ РЕШЕНИЕ: Оптимизированное подключение к Neon для Serverless
 * 
 * ПРОБЛЕМА: Vercel serverless функции создают множество параллельных соединений,
 * что может превысить лимиты подключений к базе данных
 * 
 * РЕШЕНИЕ: Используем Neon pooler с оптимизацией:
 * - Переиспользуем соединения между функциями
 * - Встроенный connection pooling от Neon
 * - SSL соединения для безопасности
 * - Graceful connection handling
 */

// Используем DATABASE_URL с Neon pooler для оптимального подключения
const CONNECTION_URL = process.env.DATABASE_URL!;

if (!CONNECTION_URL) {
  throw new Error('DATABASE_URL не найден в переменных окружения');
}

const adapter = new PrismaPg({
  connectionString: CONNECTION_URL,
  // Оптимизация для serverless
  // pool: {
  //   max: 1, // Максимум 1 соединение на функцию
  //   idleTimeoutMillis: 10000, // Закрываем неактивные соединения через 10 сек
  //   connectionTimeoutMillis: 5000, // Таймаут подключения 5 сек
  // },
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// ⚡ Global instance pattern для развертывания
// В development переиспользуем инстанс между hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 🧹 Graceful shutdown для serverless functions
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Дополнительная оптимизация для Next.js
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

