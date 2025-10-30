-- Migration: Fix promotions table to use proper array types
-- Date: 2025-10-30

-- Drop and recreate with proper array columns
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

    -- Targets (scope-specific) - Using PostgreSQL array types
    product_ids TEXT[] DEFAULT '{}',
    category_slugs TEXT[] DEFAULT '{}',
    sub_category_slugs TEXT[] DEFAULT '{}',
    format_ids TEXT[] DEFAULT '{}',
    subscription_plan_ids TEXT[] DEFAULT '{}',

    -- Advanced strategies
    application_strategy VARCHAR(20) DEFAULT 'all' CHECK (application_strategy IN (
        'all', 'cheapest', 'most-expensive', 'proportional', 'non-promo-only'
    )),
    progressive_tiers JSONB,
    buy_x_get_y_config JSONB,

    -- Stackability and priority
    is_stackable BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 5,

    -- Conditions
    conditions JSONB,

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

-- Create indexes
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_scope ON promotions(scope);
CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_priority ON promotions(priority DESC);
