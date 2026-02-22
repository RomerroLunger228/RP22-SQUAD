export interface SubscriptionTier {
  id: number;
  title: string;
  description: string;
  priority: number;
}

export interface SubscriptionPlan {
  id: number;
  tier_id: number;
  service_type: 'haircut' | 'haircut_beard';
  duration_months: 1 | 3;
  price: number;
  currency: string;
  discount_percentage: number;
  free_visits_count: number;
  stripe_price_id: string;
  service?: {
    id: number;
    name: string;
  };
  subscription_tiers?: SubscriptionTier;
}

export interface Subscription {
  id: string; // BigInt converted to string
  user_id: number;
  plan_id: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'expired' | 'cancelled';
  started_at?: Date;
  expires_at?: Date;
  created_at?: Date;
  free_visits_used: number;
  subscription_plans?: SubscriptionPlan;
}

export interface SubscriptionPlanTier {
  id: number;
  title: string;
  description: string;
  plans: SubscriptionPlan[];
}

export interface SubscriptionPlansResponse {
  tiers: SubscriptionPlanTier[];
}

export interface UserSubscriptionResponse {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    plan: {
      id: number;
      tier_name: string;
      service_name: string;
      service_type: string;
      discount_percentage: number;
      free_visits_count: number;
      duration_months: number;
      price: number;
      currency: string;
    };
    free_visits_remaining: number;
    free_visits_used: number;
    expires_at?: string;
    status: 'active' | 'expired';
  };
}

export interface SubscriptionBenefit {
  type: 'full' | 'free' | 'discount';
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

export interface SubscriptionPurchaseRequest {
  planId: number;
  userId: number;
}

export interface SubscriptionPurchaseResponse {
  checkout_url: string;
}