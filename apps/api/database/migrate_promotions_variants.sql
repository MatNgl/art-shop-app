-- Migration: Add Variant Support to Promotions
-- Ajout du support des variantes de produits dans le système de promotions

-- TypeORM gère les enums automatiquement, pas besoin de ALTER TYPE
-- Il suffit d'ajouter les nouvelles colonnes

-- Ajouter les colonnes variant_ids et variant_skus
ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS variant_ids TEXT,
ADD COLUMN IF NOT EXISTS variant_skus TEXT;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_promotions_variant_ids ON promotions USING GIN (string_to_array(variant_ids, ','));
CREATE INDEX IF NOT EXISTS idx_promotions_variant_skus ON promotions USING GIN (string_to_array(variant_skus, ','));

-- Commentaires
COMMENT ON COLUMN promotions.variant_ids IS 'Liste d''IDs de variantes ciblées (séparés par virgule) - pour scope=variant';
COMMENT ON COLUMN promotions.variant_skus IS 'Liste de SKUs de variantes ciblées (séparés par virgule) - pour scope=variant';
