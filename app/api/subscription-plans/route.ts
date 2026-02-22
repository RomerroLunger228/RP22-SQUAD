import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SubscriptionTier {
  id: number;
  title: string | null;
  description: string | null;
  priority: number | null;
}

interface ServiceWithCategory {
  name: string;
  pl_price: number;
  haircut_categories: {
    name: string;
  } | null;
}

interface SubscriptionPlan {
  id: number;
  service_type: string | null;
  duration_months: number | null;
  price: number | null;
  discount_percentage: number | null;
  free_visits_count: number | null;
  stripe_price_id: string | null;
  services: {
    id: number;
    name: string;
    pl_price: number;
  } | null;
  subscription_tiers: {
    id: number;
    title: string | null;
    description: string | null;
    priority: number | null;
  };
}

export async function GET() {
  try {
    // Проверяем, есть ли уже планы подписок в БД
    const existingPlans = await prisma.subscription_plans.findMany({
      include: {
        services: true,
        subscription_tiers: true
      }
    });

    if (existingPlans.length > 0) {
      // Если планы есть, группируем их по тирам
      const tiersMap = new Map();
      
      existingPlans.forEach((plan: SubscriptionPlan) => {
        const tier = plan.subscription_tiers;
        if (!tiersMap.has(tier.id)) {
          tiersMap.set(tier.id, {
            id: tier.id,
            title: tier.title,
            description: tier.description,
            plans: []
          });
        }
        
        tiersMap.get(tier.id).plans.push({
          id: plan.id,
          service: plan.services ? {
            id: plan.services.id,
            name: plan.services.name,
            price: plan.services.pl_price
          } : null,
          service_type: plan.service_type,
          duration_months: plan.duration_months,
          price: plan.price,
          discount_percentage: plan.discount_percentage,
          free_visits_count: plan.free_visits_count,
          stripe_price_id: plan.stripe_price_id
        });
      });

      return NextResponse.json({
        tiers: Array.from(tiersMap.values()).sort((a, b) => a.id - b.id)
      });
    }

    // Если планов нет, создаем их на основе существующих услуг
    const services = await prisma.services.findMany({
      include: {
        haircut_categories: true
      }
    });

    const tiers = await prisma.subscription_tiers.findMany({
      orderBy: { priority: 'asc' }
    });

    // Создаем планы на лету на основе существующих услуг
    const generatedTiers = tiers.map((tier: SubscriptionTier) => {
      const isDefault = tier.title === 'Default';
      const plans = [];

      // Для каждой категории создаем планы
      const categories = [...new Set(services.map((s: ServiceWithCategory) => s.haircut_categories?.name).filter(Boolean))];
      
      for (const category of categories) {
        const categoryServices = services.filter((s: ServiceWithCategory) => s.haircut_categories?.name === category);
        
        // Выбираем подходящие услуги для подписок
        const haircutService = categoryServices.find((s: ServiceWithCategory) => 
          s.name.toLowerCase().includes('стрижка') && 
          !s.name.toLowerCase().includes('борода') &&
          !s.name.toLowerCase().includes('коррекция')
        );
        
        const haircutBeardService = categoryServices.find((s: ServiceWithCategory) => 
          s.name.toLowerCase().includes('стрижка') && 
          (s.name.toLowerCase().includes('борода') || s.name.toLowerCase().includes('коррекция'))
        );

        // Создаем планы для стрижки
        if (haircutService) {
          const basePrice = haircutService.pl_price;
          plans.push(
            {
              id: `${tier.id}-haircut-1m`,
              service: {
                id: haircutService.id,
                name: haircutService.name,
                price: haircutService.pl_price
              },
              service_type: 'haircut',
              duration_months: 1,
              price: Math.round(basePrice * (isDefault ? 0.95 : 1.15)),
              discount_percentage: 5,
              free_visits_count: 1,
              stripe_price_id: `${tier.title?.toLowerCase() || 'unknown'}_haircut_1m`
            },
            {
              id: `${tier.id}-haircut-3m`,
              service: {
                id: haircutService.id,
                name: haircutService.name,
                price: haircutService.pl_price
              },
              service_type: 'haircut',
              duration_months: 3,
              price: Math.round(basePrice * 3 * (isDefault ? 0.9 : 1.1)),
              discount_percentage: 10,
              free_visits_count: 3,
              stripe_price_id: `${tier.title?.toLowerCase() || 'unknown'}_haircut_3m`
            }
          );
        }

        // Создаем планы для стрижки + борода
        if (haircutBeardService) {
          const basePrice = haircutBeardService.pl_price;
          plans.push(
            {
              id: `${tier.id}-haircut_beard-1m`,
              service: {
                id: haircutBeardService.id,
                name: haircutBeardService.name,
                price: haircutBeardService.pl_price
              },
              service_type: 'haircut_beard',
              duration_months: 1,
              price: Math.round(basePrice * (isDefault ? 0.95 : 1.15)),
              discount_percentage: 5,
              free_visits_count: 1,
              stripe_price_id: `${tier.title?.toLowerCase() || 'unknown'}_haircut_beard_1m`
            },
            {
              id: `${tier.id}-haircut_beard-3m`,
              service: {
                id: haircutBeardService.id,
                name: haircutBeardService.name,
                price: haircutBeardService.pl_price
              },
              service_type: 'haircut_beard',
              duration_months: 3,
              price: Math.round(basePrice * 3 * (isDefault ? 0.9 : 1.1)),
              discount_percentage: 10,
              free_visits_count: 3,
              stripe_price_id: `${tier.title?.toLowerCase() || 'unknown'}_haircut_beard_3m`
            }
          );
        }
      }

      return {
        id: tier.id,
        title: tier.title,
        description: tier.description,
        plans: plans.slice(0, 4) // Ограничиваем до 4 планов на тир
      };
    });

    return NextResponse.json({
      tiers: generatedTiers
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}