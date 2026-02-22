-- Добавляем новые поля в subscription_plans
ALTER TABLE "subscription_plans" 
ADD COLUMN "service_type" TEXT,
ADD COLUMN "discount_percentage" INTEGER,
ADD COLUMN "free_visits_count" INTEGER;

-- Добавляем новые поля в subscription
ALTER TABLE "subscription" 
ADD COLUMN "free_visits_used" INTEGER DEFAULT 0;

-- Добавляем уникальный индекс для user_id в subscription
ALTER TABLE "subscription" 
ADD CONSTRAINT "subscription_user_id_key" UNIQUE ("user_id");

-- Добавляем новые поля в appointments  
ALTER TABLE "appointments"
ADD COLUMN "subscription_benefit_type" TEXT,
ADD COLUMN "original_service_price" INTEGER,
ADD COLUMN "discount_amount" INTEGER;