// lib/auth-jwt.ts
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * 🚀 STATELESS JWT AUTHENTICATION SYSTEM
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ:
 * ❌ Было: каждый API call → DB запрос для auth
 * ✅ Стало: каждый API call → локальная проверка JWT (0ms)
 * 
 * ПРИНЦИПЫ:
 * - Functional programming
 * - Pure functions без side effects
 * - Композируемые утилиты
 * - Type safety
 */

// ========================================
// TYPES & INTERFACES
// ========================================

/**
 * Базовые данные пользователя в JWT токене
 * Только неизменяемые данные для минимизации размера токена
 */
export interface BaseUserPayload {
  readonly userId: number;
  readonly telegramId: string;
  readonly username: string;
}

/**
 * Полная структура JWT токена
 */
export interface AuthTokenPayload extends JWTPayload, BaseUserPayload {
  readonly exp: number;
  readonly iat: number;
}

/**
 * Результат валидации токена
 */
export interface AuthValidationResult {
  readonly isValid: boolean;
  readonly user?: BaseUserPayload;
  readonly error?: string;
}

// ========================================
// CONFIGURATION CONSTANTS
// ========================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is required');
  })()
);

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60; // 7 дней

// ========================================
// CORE JWT OPERATIONS
// ========================================

/**
 * Type guard для проверки payload структуры
 */
const isValidTokenPayload = (payload: JWTPayload): payload is AuthTokenPayload => (
  typeof payload === 'object' &&
  payload !== null &&
  typeof payload.userId === 'number' &&
  typeof payload.telegramId === 'string' &&
  typeof payload.username === 'string' &&
  typeof payload.exp === 'number' &&
  typeof payload.iat === 'number'
);

/**
 * Создание JWT токена
 */
export const createAuthToken = async (user: BaseUserPayload): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: AuthTokenPayload = {
    userId: user.userId,
    telegramId: user.telegramId,
    username: user.username,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_LIFETIME_SECONDS}s`)
    .sign(JWT_SECRET);
};

/**
 * Валидация JWT токена
 */
export const validateAuthToken = async (token: string): Promise<AuthValidationResult> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (!isValidTokenPayload(payload)) {
      return {
        isValid: false,
        error: 'Invalid token structure'
      };
    }

    const user: BaseUserPayload = {
      userId: payload.userId,
      telegramId: payload.telegramId,
      username: payload.username
    };

    return {
      isValid: true,
      user
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
    return {
      isValid: false,
      error: errorMessage
    };
  }
};

// ========================================
// REQUEST HELPERS
// ========================================

/**
 * Извлечение токена из Authorization header
 */
const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1] : authHeader;
};

/**
 * Получение данных пользователя из запроса
 */
export const extractUserFromRequest = async (request: NextRequest): Promise<BaseUserPayload | null> => {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  const result = await validateAuthToken(token);
  return result.isValid ? result.user! : null;
};

// ========================================
// COMPATIBILITY LAYER
// Drop-in replacements для существующего auth-middleware
// ========================================

/**
 * Drop-in replacement для getCurrentUserId()
 */
export const getCurrentUserId = async (request: NextRequest): Promise<number | null> => {
  const user = await extractUserFromRequest(request);
  return user?.userId ?? null;
};

/**
 * Drop-in replacement для getCurrentUser()  
 */
export const getCurrentUser = async (request: NextRequest): Promise<BaseUserPayload | null> => 
  extractUserFromRequest(request);

/**
 * Проверка авторизации пользователя
 */
export const isAuthenticated = async (request: NextRequest): Promise<boolean> => {
  const user = await extractUserFromRequest(request);
  return user !== null;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Создание стандартного ответа об ошибке авторизации
 */
export const createUnauthorizedResponse = (): Response => 
  Response.json(
    { 
      success: false, 
      error: 'Unauthorized. Please login through Telegram.' 
    },
    { status: 401 }
  );

/**
 * Проверка валидности токена без извлечения данных
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
  const result = await validateAuthToken(token);
  return result.isValid;
};