-- Migration: Product Variants (Phase 1.5)
-- Tables: product_variants (refonte du système de variantes)
-- Stratégie: Prix dans variantes, réductions dans Promotions

-- Extension UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- Table: product_variants
-- ==============================================
-- Chaque produit peut avoir plusieurs variantes (formats différents)
-- Chaque variante a son propre prix, stock, et référence à un format

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- SKU unique pour identifier la variante
    sku VARCHAR(100) UNIQUE NOT NULL,

    -- Format: soit prédéfini (A3/A4/A5), soit personnalisé
    format_type VARCHAR(20) NOT NULL CHECK (format_type IN ('predefined', 'custom')),
    format_id UUID REFERENCES print_formats(id) ON DELETE SET NULL,

    -- Dimensions personnalisées (si format_type = 'custom')
    custom_width DECIMAL(10,2),
    custom_height DECIMAL(10,2),
    custom_unit VARCHAR(10) DEFAULT 'cm',

    -- Prix de la variante (PAS de discount ici, géré par Promotions)
    price DECIMAL(10,2) NOT NULL,

    -- Stock spécifique à cette variante
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0, -- Stock réservé dans les paniers
    low_stock_threshold INT DEFAULT 5,

    -- Poids pour calcul de livraison
    weight DECIMAL(10,2),

    -- Image spécifique à la variante (optionnel)
    image_url VARCHAR(500),

    -- Statut
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes de validation
    CONSTRAINT check_format_data CHECK (
        (format_type = 'predefined' AND format_id IS NOT NULL) OR
        (format_type = 'custom' AND custom_width IS NOT NULL AND custom_height IS NOT NULL)
    ),
    CONSTRAINT check_stock_quantities CHECK (reserved_quantity >= 0 AND reserved_quantity <= stock_quantity),
    CONSTRAINT check_price_positive CHECK (price > 0)
);

-- ==============================================
-- Indexes pour performances
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_format_id ON product_variants(format_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON product_variants(product_id, is_active);

-- ==============================================
-- Trigger pour updated_at automatique
-- ==============================================

CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- Fonction helper: Stock disponible
-- ==============================================

CREATE OR REPLACE FUNCTION get_available_stock(variant_id UUID)
RETURNS INT AS $$
DECLARE
    available INT;
BEGIN
    SELECT (stock_quantity - reserved_quantity) INTO available
    FROM product_variants
    WHERE id = variant_id;

    RETURN COALESCE(available, 0);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- Vue: Variantes avec infos complètes
-- ==============================================

CREATE OR REPLACE VIEW product_variants_detailed AS
SELECT
    pv.id,
    pv.product_id,
    pv.sku,
    pv.format_type,
    pv.format_id,
    pv.price,
    pv.stock_quantity,
    pv.reserved_quantity,
    (pv.stock_quantity - pv.reserved_quantity) AS available_stock,
    pv.low_stock_threshold,
    pv.weight,
    pv.image_url,
    pv.is_active,
    pv.display_order,
    pv.created_at,
    pv.updated_at,
    -- Infos format prédéfini
    pf.name AS format_name,
    pf.width AS format_width,
    pf.height AS format_height,
    pf.unit AS format_unit,
    -- Infos format custom
    pv.custom_width,
    pv.custom_height,
    pv.custom_unit,
    -- Dimensions finales (prédéfini OU custom)
    COALESCE(pf.width, pv.custom_width) AS width,
    COALESCE(pf.height, pv.custom_height) AS height,
    COALESCE(pf.unit, pv.custom_unit) AS unit,
    -- Infos produit
    p.name AS product_name,
    p.slug AS product_slug,
    p.is_available AS product_available
FROM product_variants pv
LEFT JOIN print_formats pf ON pv.format_id = pf.id
LEFT JOIN products p ON pv.product_id = p.id;
