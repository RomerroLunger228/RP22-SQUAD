import { NextRequest } from 'next/server';
import { getCurrentUser } from './auth-jwt';
import { prisma } from './prisma';

/**
 * Проверяет что пользователь является администратором
 * Использует JWT токены + проверка роли в БД для безопасности
 */
export async function requireAdminJWT(request: NextRequest) {
  // Сначала проверяем JWT токен
  const user = await getCurrentUser(request);
  
  if (!user) {
    return null;
  }

  // Затем проверяем роль в базе данных (безопасно)
  const dbUser = await prisma.users.findUnique({
    where: { id: user.userId },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    return null;
  }

  return user;
}

/**
 * Создает стандартный ответ об ошибке доступа администратора
 */
export const createAdminForbiddenResponse = () => 
  Response.json(
    { error: 'Admin access required. Please login as administrator.' },
    { status: 403 }
  );