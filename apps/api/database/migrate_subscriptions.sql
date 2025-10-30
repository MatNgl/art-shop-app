-- Migration: Subscriptions Module (Phase 1.4)
-- Tables: subscription_plans, user_subscriptions

-- Extension UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    months_offered_on_annual INT DEFAULT 0,
    perks_short TEXT[] DEFAULT '{}',
    perks_full TEXT[] DEFAULT '{}',
    loyalty_multiplier DECIMAL(3,2) DEFAULT 1.0,
    monthly_points_cap INT DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'public',
    is_active BOOLEAN DEFAULT true,
    deprecated BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des abonnements utilisateur
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    term VARCHAR(20) NOT NULL CHECK (term IN ('monthly', 'annual')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
    started_at TIMESTAMP NOT NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    applied_multiplier DECIMAL(3,2) NOT NULL,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_visibility ON subscription_plans(visibility);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, deprecated);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);

-- Contrainte : un seul abonnement actif par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_subscription_per_user
ON user_subscriptions(user_id) WHERE status = 'active';

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
