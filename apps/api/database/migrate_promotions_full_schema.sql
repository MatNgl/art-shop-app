-- Migration: Extend promotions table with advanced fields
-- Date: 2025-10-30
-- Purpose: Add all fields for advanced promotion system (scope, strategies, conditions, etc.)

-- Drop existing promotions table and recreate with full schema
DROP TABLE IF EXISTS promotions CASCADE;

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type and scope
    type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (type IN ('automatic', 'code')),
    code VARCHAR(50) UNIQUE,
    scope VARCHAR(20) NOT NULL CHECK (scope IN (
        'product', 'category', 'subcategory', 'site-wide', 'format',
        'cart', 'shipping', 'user-segment', 'buy-x-get-y', 'subscription'
    )),

    -- Discount
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL,

    -- Targets (scope-specific)
    product_ids TEXT, -- Comma-separated UUIDs
    category_slugs TEXT, -- Comma-separated slugs
    sub_category_slugs TEXT, -- Comma-separated slugs
    format_ids TEXT, -- Comma-separated UUIDs
    subscription_plan_ids TEXT, -- Comma-separated UUIDs

    -- Advanced strategies
    application_strategy VARCHAR(20) DEFAULT 'all' CHECK (application_strategy IN (
        'all', 'cheapest', 'most-expensive', 'proportional', 'non-promo-only'
    )),
    progressive_tiers JSONB, -- Array of { minAmount, discountValue, discountType }
    buy_x_get_y_config JSONB, -- { buyQuantity, getQuantity, applyOn }

    -- Stackability and priority
    is_stackable BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 5,

    -- Conditions
    conditions JSONB, -- { minQuantity, minAmount, maxUsagePerUser, maxUsageTotal, userSegment, excludePromotedProducts }

    -- Validity
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,

    -- State
    is_active BOOLEAN DEFAULT true,

    -- Tracking
    current_usage INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_scope ON promotions(scope);
CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_priority ON promotions(priority DESC);

-- Comments
COMMENT ON TABLE promotions IS 'Advanced promotions system with multiple scopes and strategies';
COMMENT ON COLUMN promotions.type IS 'automatic (applied automatically) or code (requires promo code)';
COMMENT ON COLUMN promotions.scope IS 'Where the promotion applies (product, category, cart, etc.)';
COMMENT ON COLUMN promotions.application_strategy IS 'How to apply the discount (all items, cheapest, most expensive, etc.)';
COMMENT ON COLUMN promotions.progressive_tiers IS 'Progressive discount tiers based on cart amount';
COMMENT ON COLUMN promotions.buy_x_get_y_config IS 'Buy X Get Y configuration (e.g., buy 3 get 1 free)';
COMMENT ON COLUMN promotions.conditions IS 'Application conditions (min amount, max usage, user segment, etc.)';
