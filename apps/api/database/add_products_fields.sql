-- ============================================
-- Migration: Ajout des champs manquants pour Products
-- Date: 2025-10-28
-- Description: Ajoute tous les champs nécessaires pour être compatible avec le frontend
-- ============================================

-- 1. Ajouter les colonnes manquantes à la table products
ALTER TABLE products
  -- Renommer name en title pour correspondre au frontend
  RENAME COLUMN name TO title;

-- Ajouter les colonnes de pricing
ALTER TABLE products
  RENAME COLUMN base_price TO original_price;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reduced_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS has_promotion BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS discount INTEGER;

-- Ajouter les colonnes de données enrichies
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technique VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dimensions JSONB,
  ADD COLUMN IF NOT EXISTS format_id INTEGER;

-- Ajouter colonne stock (en plus de stock_quantity pour compatibilité)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Copier stock_quantity vers stock pour compatibilité
UPDATE products SET stock = stock_quantity WHERE stock = 0;

-- Ajouter les colonnes pour éditions limitées
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edition_number INTEGER,
  ADD COLUMN IF NOT EXISTS total_editions INTEGER;

-- 2. Modifier la table product_variants pour correspondre au frontend
-- (La table existe déjà depuis la migration précédente)
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS reduced_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- Renommer si besoin
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns
            WHERE table_name='product_variants' AND column_name='price_modifier') THEN
    -- Supprimer price_modifier car on va utiliser original_price/reduced_price
    ALTER TABLE product_variants DROP COLUMN price_modifier;
  END IF;
END $$;

-- 3. S'assurer que la table product_category_associations existe
CREATE TABLE IF NOT EXISTS product_category_associations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sub_category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, category_id, sub_category_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_product_category_assoc_product
  ON product_category_associations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_assoc_category
  ON product_category_associations(category_id);
CREATE INDEX IF NOT EXISTS idx_product_category_assoc_sub_category
  ON product_category_associations(sub_category_id);

-- 4. Créer des indexes pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_technique ON products(technique);
CREATE INDEX IF NOT EXISTS idx_products_is_limited_edition ON products(is_limited_edition);
CREATE INDEX IF NOT EXISTS idx_products_has_promotion ON products(has_promotion);

-- 5. Ajouter des contraintes
ALTER TABLE products
  ADD CONSTRAINT check_reduced_price_lower
    CHECK (reduced_price IS NULL OR reduced_price < original_price);

ALTER TABLE products
  ADD CONSTRAINT check_discount_range
    CHECK (discount IS NULL OR (discount >= 0 AND discount <= 100));

ALTER TABLE products
  ADD CONSTRAINT check_edition_numbers
    CHECK (
      (is_limited_edition = FALSE) OR
      (is_limited_edition = TRUE AND edition_number IS NOT NULL AND total_editions IS NOT NULL)
    );

-- 6. Mettre à jour has_promotion en fonction de reduced_price
UPDATE products
SET has_promotion = TRUE
WHERE reduced_price IS NOT NULL AND reduced_price > 0;

-- 7. Calculer le discount en pourcentage si reduced_price existe
UPDATE products
SET discount = ROUND(((original_price - reduced_price) / original_price * 100)::numeric, 0)
WHERE reduced_price IS NOT NULL AND reduced_price > 0 AND original_price > 0;

COMMENT ON COLUMN products.title IS 'Titre du produit (correspond au "title" frontend)';
COMMENT ON COLUMN products.original_price IS 'Prix original du produit';
COMMENT ON COLUMN products.reduced_price IS 'Prix réduit si promotion';
COMMENT ON COLUMN products.has_promotion IS 'Indique si le produit a une promotion active';
COMMENT ON COLUMN products.discount IS 'Pourcentage de réduction (0-100)';
COMMENT ON COLUMN products.tags IS 'Tags pour recherche et filtrage';
COMMENT ON COLUMN products.images IS 'URLs des images du produit (array)';
COMMENT ON COLUMN products.technique IS 'Technique utilisée (huile, aquarelle, etc.)';
COMMENT ON COLUMN products.dimensions IS 'Dimensions de l''oeuvre originale en JSONB {width, height, depth, unit}';
COMMENT ON COLUMN products.format_id IS 'Format d''impression pour produit sans variantes';
COMMENT ON COLUMN products.is_limited_edition IS 'Indique si c''est une édition limitée';
COMMENT ON COLUMN products.edition_number IS 'Numéro de l''exemplaire dans l''édition limitée';
COMMENT ON COLUMN products.total_editions IS 'Nombre total d''exemplaires de l''édition limitée';

COMMENT ON TABLE product_category_associations IS 'Associations multiples entre produits et catégories/sous-catégories';
