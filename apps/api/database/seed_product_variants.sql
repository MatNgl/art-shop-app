-- Seed: Product Variants
-- Exemples de variantes pour des produits existants

-- Récupérer les IDs des produits et formats existants
-- (À adapter selon les données réelles)

-- Exemple 1: Variantes pour un produit existant avec formats prédéfinis
-- Supposons product_id = premier produit disponible

DO $$
DECLARE
    v_product_id UUID;
    v_format_a3_id UUID;
    v_format_a4_id UUID;
    v_format_a5_id UUID;
BEGIN
    -- Récupérer le premier produit disponible
    SELECT id INTO v_product_id FROM products WHERE is_available = true LIMIT 1;

    -- Récupérer les formats (ou les créer s'ils n'existent pas)
    -- Format A3
    SELECT id INTO v_format_a3_id FROM print_formats WHERE name = 'A3';
    IF v_format_a3_id IS NULL THEN
        INSERT INTO print_formats (name, width, height, unit)
        VALUES ('A3', 29.7, 42, 'cm')
        RETURNING id INTO v_format_a3_id;
    END IF;

    -- Format A4
    SELECT id INTO v_format_a4_id FROM print_formats WHERE name = 'A4';
    IF v_format_a4_id IS NULL THEN
        INSERT INTO print_formats (name, width, height, unit)
        VALUES ('A4', 21, 29.7, 'cm')
        RETURNING id INTO v_format_a4_id;
    END IF;

    -- Format A5
    SELECT id INTO v_format_a5_id FROM print_formats WHERE name = 'A5';
    IF v_format_a5_id IS NULL THEN
        INSERT INTO print_formats (name, width, height, unit)
        VALUES ('A5', 14.8, 21, 'cm')
        RETURNING id INTO v_format_a5_id;
    END IF;

    -- Créer des variantes si un produit existe
    IF v_product_id IS NOT NULL THEN
        -- Variante A3 - Format prédéfini
        INSERT INTO product_variants (
            product_id,
            sku,
            format_type,
            format_id,
            price,
            stock_quantity,
            weight,
            display_order
        ) VALUES (
            v_product_id,
            'PROD-' || SUBSTRING(v_product_id::TEXT, 1, 8) || '-A3',
            'predefined',
            v_format_a3_id,
            79.99,
            50,
            0.8,
            1
        ) ON CONFLICT (sku) DO NOTHING;

        -- Variante A4 - Format prédéfini
        INSERT INTO product_variants (
            product_id,
            sku,
            format_type,
            format_id,
            price,
            stock_quantity,
            weight,
            display_order
        ) VALUES (
            v_product_id,
            'PROD-' || SUBSTRING(v_product_id::TEXT, 1, 8) || '-A4',
            'predefined',
            v_format_a4_id,
            59.99,
            100,
            0.5,
            2
        ) ON CONFLICT (sku) DO NOTHING;

        -- Variante A5 - Format prédéfini
        INSERT INTO product_variants (
            product_id,
            sku,
            format_type,
            format_id,
            price,
            stock_quantity,
            weight,
            display_order
        ) VALUES (
            v_product_id,
            'PROD-' || SUBSTRING(v_product_id::TEXT, 1, 8) || '-A5',
            'predefined',
            v_format_a5_id,
            39.99,
            150,
            0.3,
            3
        ) ON CONFLICT (sku) DO NOTHING;

        -- Variante Custom - Taille personnalisée 50x70cm
        INSERT INTO product_variants (
            product_id,
            sku,
            format_type,
            custom_width,
            custom_height,
            custom_unit,
            price,
            stock_quantity,
            weight,
            display_order
        ) VALUES (
            v_product_id,
            'PROD-' || SUBSTRING(v_product_id::TEXT, 1, 8) || '-CUSTOM-50x70',
            'custom',
            50,
            70,
            'cm',
            129.99,
            20,
            1.5,
            4
        ) ON CONFLICT (sku) DO NOTHING;

        RAISE NOTICE 'Variantes créées pour le produit %', v_product_id;
    ELSE
        RAISE NOTICE 'Aucun produit disponible pour créer des variantes';
    END IF;
END $$;
