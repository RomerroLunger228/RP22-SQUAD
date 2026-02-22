import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminJWT, createAdminForbiddenResponse } from '@/lib/admin-auth';

interface UserWithSubscription {
  id: number;
  username: string;
  points: number | null;
  role: string;
  avatar_url: string | null;
  subscription: {
    status: string | null;
    subscription_plans: {
      subscription_tiers: {
        title: string | null;
      };
    } | null;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем что пользователь - админ
    const admin = await requireAdminJWT(request);
    
    if (!admin) {
      return createAdminForbiddenResponse();
    }
    const users = await prisma.users.findMany({
      include: {
        subscription: {
          include: {
            subscription_plans: {
              include: {
                subscription_tiers: true,
                services: true
              }
            }
          }
        }
      }
    });
    
    // Конвертируем BigInt в Number для сериализации и добавляем информацию о подписке для списка
    const serializedUsers = users.map((user: UserWithSubscription) => ({
      id: Number(user.id),
      username: user.username,
      points: user.points ? Number(user.points) : null,
      role: user.role,
      avatar_url: user.avatar_url,
      // Простая информация о подписке для списка и фильтрации
      subscription: user.subscription && user.subscription.status === 'active' ? true : false,
      subscriptionTier: user.subscription && user.subscription.status === 'active' 
        ? user.subscription.subscription_plans?.subscription_tiers?.title 
        : null
    }));
    
    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем что пользователь - админ
    const admin = await requireAdminJWT(request);
    
    if (!admin) {
      return createAdminForbiddenResponse();
    }

    const body = await request.json();
    const { username, points, role } = body;
    
    const user = await prisma.users.create({
      data: {
        username,
        points: points || 10,
       
        role: role || 'user'
      }
    });
    
    // Конвертируем BigInt в Number для сериализации
    const serializedUser = {
      ...user,
      id: Number(user.id),
      points: user.points ? Number(user.points) : null
    };
    
    return NextResponse.json(serializedUser);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
} 

