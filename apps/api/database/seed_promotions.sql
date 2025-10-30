-- Seed: Insert test promotions for testing
-- Date: 2025-10-30

-- 1. Promotion automatique site-wide -15%
INSERT INTO promotions (name, description, type, scope, discount_type, discount_value, start_date, end_date, is_active, priority)
VALUES (
    'Promo Site -15%',
    '-15% sur tout le site',
    'automatic',
    'site-wide',
    'percentage',
    15,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    5
);

-- 2. Code promo WELCOME10 (-10€ dès 50€)
INSERT INTO promotions (name, description, type, code, scope, discount_type, discount_value, conditions, start_date, is_active, priority)
VALUES (
    'Code WELCOME10',
    '-10€ sur votre commande',
    'code',
    'WELCOME10',
    'cart',
    'fixed',
    10,
    '{"minAmount": 50, "maxUsagePerUser": 1}'::jsonb,
    NOW(),
    true,
    5
);

-- 3. Promotion catégorie "photographie" -20%
INSERT INTO promotions (name, description, type, scope, category_slugs, discount_type, discount_value, start_date, end_date, is_active, priority)
VALUES (
    'Promo Photographie',
    '-20% sur toute la photographie',
    'automatic',
    'category',
    ARRAY['photographie'],
    'percentage',
    20,
    NOW(),
    NOW() + INTERVAL '7 days',
    true,
    6
);

-- 4. Buy 3 Get 1 Free (le moins cher offert)
INSERT INTO promotions (name, description, type, scope, discount_type, discount_value, buy_x_get_y_config, start_date, is_active, priority)
VALUES (
    '3 achetés = 1 offert',
    'Achetez 3 articles, le moins cher est offert',
    'automatic',
    'buy-x-get-y',
    'percentage',
    100,
    '{"buyQuantity": 3, "getQuantity": 1, "applyOn": "cheapest"}'::jsonb,
    NOW(),
    true,
    7
);

-- 5. Livraison gratuite dès 40€
INSERT INTO promotions (name, description, type, scope, discount_type, discount_value, conditions, start_date, is_active, priority, is_stackable)
VALUES (
    'Livraison gratuite dès 40€',
    'Livraison offerte dès 40€ d''achat',
    'automatic',
    'shipping',
    'free_shipping',
    0,
    '{"minAmount": 40}'::jsonb,
    NOW(),
    true,
    10,
    true
);

-- 6. Code promo SUMMER20 (-20% site-wide)
INSERT INTO promotions (name, description, type, code, scope, discount_type, discount_value, conditions, start_date, end_date, is_active, priority)
VALUES (
    'Code SUMMER20',
    '-20% sur tout le site avec SUMMER20',
    'code',
    'SUMMER20',
    'site-wide',
    'percentage',
    20,
    '{"minAmount": 30, "maxUsageTotal": 100}'::jsonb,
    NOW(),
    NOW() + INTERVAL '60 days',
    true,
    8
);

-- 7. Promotion progressive (paliers)
INSERT INTO promotions (name, description, type, scope, discount_type, discount_value, progressive_tiers, start_date, is_active, priority)
VALUES (
    'Promo Progressive',
    'Plus vous achetez, plus vous économisez',
    'automatic',
    'cart',
    'percentage',
    10,
    '[
        {"minAmount": 50, "discountValue": 10, "discountType": "percentage"},
        {"minAmount": 100, "discountValue": 20, "discountType": "percentage"},
        {"minAmount": 150, "discountValue": 30, "discountType": "percentage"}
    ]'::jsonb,
    NOW(),
    false,
    6
);
