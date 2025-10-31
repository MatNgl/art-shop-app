-- Seed data pour tester le module Cart
-- Crée des paniers de test avec items

-- Variables pour les tests (ajuster selon tes données)
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
    test_variant_a4_id UUID;
    test_variant_a3_id UUID;
    cart_user_id UUID;
    cart_guest_id UUID;
BEGIN
    -- Récupérer un utilisateur de test (premier utilisateur avec role = 'user')
    SELECT id INTO test_user_id
    FROM users
    WHERE role = 'user'
    LIMIT 1;

    -- Récupérer un produit de test
    SELECT id INTO test_product_id
    FROM products
    WHERE is_available = true
    LIMIT 1;

    -- Récupérer des variantes de test (chercher par SKU ou simplement prendre les 2 premières)
    SELECT id INTO test_variant_a4_id
    FROM product_variants
    WHERE product_id = test_product_id
    ORDER BY created_at ASC
    LIMIT 1;

    SELECT id INTO test_variant_a3_id
    FROM product_variants
    WHERE product_id = test_product_id
    ORDER BY created_at ASC
    OFFSET 1
    LIMIT 1;

    -- Si pas de données disponibles, afficher message et quitter
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Aucun utilisateur disponible pour créer panier de test';
        RETURN;
    END IF;

    IF test_product_id IS NULL THEN
        RAISE NOTICE 'Aucun produit disponible pour créer panier de test';
        RETURN;
    END IF;

    -- 1. Créer un panier utilisateur
    INSERT INTO carts (user_id, guest_token)
    VALUES (test_user_id, NULL)
    RETURNING id INTO cart_user_id;

    RAISE NOTICE 'Panier utilisateur créé: %', cart_user_id;

    -- Ajouter items au panier utilisateur
    IF test_variant_a4_id IS NOT NULL THEN
        INSERT INTO cart_items (
            cart_id, kind, product_id, variant_id,
            title, image_url, variant_label,
            unit_price, quantity, max_stock
        )
        VALUES (
            cart_user_id, 'product', test_product_id, test_variant_a4_id,
            'Tableau Test A4', 'https://example.com/image.jpg', 'A4 (21 × 29.7 cm)',
            59.99, 2, 10
        );

        RAISE NOTICE 'Item A4 ajouté au panier utilisateur';
    END IF;

    IF test_variant_a3_id IS NOT NULL THEN
        INSERT INTO cart_items (
            cart_id, kind, product_id, variant_id,
            title, image_url, variant_label,
            unit_price, quantity, max_stock
        )
        VALUES (
            cart_user_id, 'product', test_product_id, test_variant_a3_id,
            'Tableau Test A3', 'https://example.com/image.jpg', 'A3 (29.7 × 42 cm)',
            79.99, 1, 5
        );

        RAISE NOTICE 'Item A3 ajouté au panier utilisateur';
    END IF;

    -- 2. Créer un panier invité
    INSERT INTO carts (user_id, guest_token)
    VALUES (NULL, 'guest_test_token_123456789')
    RETURNING id INTO cart_guest_id;

    RAISE NOTICE 'Panier invité créé: %', cart_guest_id;

    -- Ajouter item au panier invité
    IF test_variant_a4_id IS NOT NULL THEN
        INSERT INTO cart_items (
            cart_id, kind, product_id, variant_id,
            title, image_url, variant_label,
            unit_price, quantity, max_stock
        )
        VALUES (
            cart_guest_id, 'product', test_product_id, test_variant_a4_id,
            'Tableau Test A4', 'https://example.com/image.jpg', 'A4 (21 × 29.7 cm)',
            59.99, 1, 10
        );

        RAISE NOTICE 'Item ajouté au panier invité';
    END IF;

    RAISE NOTICE '✅ Seed data cart créé avec succès';
    RAISE NOTICE '   - Panier utilisateur (user_id: %): % items', test_user_id, (SELECT COUNT(*) FROM cart_items WHERE cart_id = cart_user_id);
    RAISE NOTICE '   - Panier invité (token: guest_test_token_123456789): % items', (SELECT COUNT(*) FROM cart_items WHERE cart_id = cart_guest_id);

END $$;

-- Afficher résumé des paniers créés
SELECT
    c.id AS cart_id,
    CASE WHEN c.user_id IS NOT NULL THEN 'User' ELSE 'Guest' END AS cart_type,
    COALESCE(c.guest_token, c.user_id::text) AS identifier,
    COUNT(ci.id) AS item_count,
    SUM(ci.unit_price * ci.quantity) AS total
FROM carts c
LEFT JOIN cart_items ci ON ci.cart_id = c.id
GROUP BY c.id, c.user_id, c.guest_token
ORDER BY c.created_at DESC
LIMIT 10;
