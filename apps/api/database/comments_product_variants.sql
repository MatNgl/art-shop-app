-- Comments pour les tables de variantes de produits
-- À exécuter après les migrations

-- ======================
-- Table: product_variants
-- ======================

COMMENT ON TABLE product_variants IS 'Variantes de produits avec formats et stocks individuels';

COMMENT ON COLUMN product_variants.id IS 'Identifiant unique de la variante (UUID)';
COMMENT ON COLUMN product_variants.product_id IS 'Référence vers le produit parent';
COMMENT ON COLUMN product_variants.sku IS 'SKU unique de la variante (Stock Keeping Unit)';
COMMENT ON COLUMN product_variants.format_type IS 'Type de format (predefined = format prédéfini, custom = dimensions personnalisées)';
COMMENT ON COLUMN product_variants.format_id IS 'Référence vers un format prédéfini (print_formats) si format_type=predefined';
COMMENT ON COLUMN product_variants.custom_width IS 'Largeur personnalisée en unités (si format_type=custom)';
COMMENT ON COLUMN product_variants.custom_height IS 'Hauteur personnalisée en unités (si format_type=custom)';
COMMENT ON COLUMN product_variants.custom_unit IS 'Unité des dimensions personnalisées (cm, mm, in)';
COMMENT ON COLUMN product_variants.price IS 'Prix de cette variante (géré ici, réductions dans Promotions)';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Quantité en stock (premier payé, premier servi - pas de réservation)';
COMMENT ON COLUMN product_variants.low_stock_threshold IS 'Seuil d''alerte stock bas (pour notifications)';
COMMENT ON COLUMN product_variants.weight IS 'Poids en kg (pour calcul frais de livraison)';
COMMENT ON COLUMN product_variants.image_url IS 'URL image spécifique à cette variante (optionnel)';
COMMENT ON COLUMN product_variants.is_active IS 'Variante active et vendable';
COMMENT ON COLUMN product_variants.display_order IS 'Ordre d''affichage dans l''interface (ASC)';
COMMENT ON COLUMN product_variants.created_at IS 'Date de création de la variante';
COMMENT ON COLUMN product_variants.updated_at IS 'Date de dernière modification';
