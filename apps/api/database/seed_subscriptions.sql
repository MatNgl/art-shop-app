-- Seed: Plans d'abonnement
-- 3 plans : Starter, Plus, Pro

-- 1. Plan Starter
INSERT INTO subscription_plans (
    slug,
    name,
    description,
    monthly_price,
    annual_price,
    months_offered_on_annual,
    perks_short,
    perks_full,
    loyalty_multiplier,
    monthly_points_cap,
    visibility,
    is_active,
    deprecated,
    display_order
) VALUES (
    'starter',
    'Starter Box',
    'Box mensuelle idéale pour découvrir l''art contemporain',
    29.99,
    299.90,
    2,
    ARRAY['1 œuvre par mois', 'Livraison gratuite', 'Support prioritaire'],
    ARRAY[
        '1 œuvre d''art originale par mois',
        'Livraison gratuite en France métropolitaine',
        'Support client prioritaire par email',
        'Accès anticipé aux nouvelles collections',
        'Newsletter exclusive avec conseils d''artistes'
    ],
    1.1,
    500,
    'public',
    true,
    false,
    1
) ON CONFLICT (slug) DO NOTHING;

-- 2. Plan Plus
INSERT INTO subscription_plans (
    slug,
    name,
    description,
    monthly_price,
    annual_price,
    months_offered_on_annual,
    perks_short,
    perks_full,
    loyalty_multiplier,
    monthly_points_cap,
    visibility,
    is_active,
    deprecated,
    display_order
) VALUES (
    'plus',
    'Plus Box',
    'Pour les passionnés d''art souhaitant enrichir leur collection',
    49.99,
    499.90,
    2,
    ARRAY['2 œuvres par mois', 'Livraison express', 'Points fidélité x1.2', 'Événements VIP'],
    ARRAY[
        '2 œuvres d''art originales par mois',
        'Livraison express gratuite (48h)',
        'Support client prioritaire par téléphone',
        'Multiplicateur de points fidélité x1.2',
        'Invitations aux événements VIP et vernissages',
        'Accès à la galerie virtuelle exclusive',
        '10% de réduction sur achats ponctuels'
    ],
    1.2,
    1000,
    'public',
    true,
    false,
    2
) ON CONFLICT (slug) DO NOTHING;

-- 3. Plan Pro
INSERT INTO subscription_plans (
    slug,
    name,
    description,
    monthly_price,
    annual_price,
    months_offered_on_annual,
    perks_short,
    perks_full,
    loyalty_multiplier,
    monthly_points_cap,
    visibility,
    is_active,
    deprecated,
    display_order
) VALUES (
    'pro',
    'Pro Collection',
    'L''abonnement premium pour collectionneurs exigeants',
    99.99,
    999.90,
    3,
    ARRAY['4 œuvres par mois', 'Curation personnalisée', 'Points x1.5', 'Concierge dédié'],
    ARRAY[
        '4 œuvres d''art originales par mois',
        'Service de curation personnalisée par expert',
        'Livraison white-glove avec installation',
        'Support client dédié 7j/7',
        'Multiplicateur de points fidélité x1.5',
        'Invitations VIP à tous les événements exclusifs',
        'Accès anticipé 48h avant toutes les sorties',
        '20% de réduction sur tous les achats ponctuels',
        'Possibilité d''échange d''œuvres une fois par trimestre',
        'Séances de conseil en art personnalisées'
    ],
    1.5,
    0,
    'public',
    true,
    false,
    3
) ON CONFLICT (slug) DO NOTHING;
