-- Migration: Création des tables carts et cart_items
-- Module: CartModule
-- Description: Panier utilisateur avec items (produits + variantes)
-- Logique: Réplique CartStore frontend avec persistence BDD

-- Table: carts (panier utilisateur ou invité)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Utilisateur (null pour panier invité)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Token pour panier invité (équivalent cart:guest localStorage)
    guest_token VARCHAR(255) UNIQUE,

    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT check_cart_owner CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL) OR
        (user_id IS NULL AND guest_token IS NOT NULL)
    )
);

-- Table: cart_items (lignes du panier)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relation panier
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,

    -- Type de ligne (product ou subscription)
    kind VARCHAR(20) NOT NULL DEFAULT 'product',

    -- Relations produit/variante
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

    -- Données dénormalisées (snapshot)
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    variant_label VARCHAR(100),
    artist_name VARCHAR(255),
    category_slug VARCHAR(100),

    -- Prix et quantité
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    max_stock INT NOT NULL DEFAULT 0,

    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT check_kind CHECK (kind IN ('product', 'subscription')),
    CONSTRAINT check_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0 AND quantity <= 99),
    CONSTRAINT check_max_stock_positive CHECK (max_stock >= 0),

    -- Unicité: un seul item par (cart_id, product_id, variant_id)
    -- Si même produit + variante, on incrémente la quantité au lieu de créer nouvelle ligne
    CONSTRAINT unique_cart_item UNIQUE (cart_id, product_id, variant_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_guest_token ON carts(guest_token);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

-- Trigger: mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION update_carts_updated_at();

CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_items_updated_at();

-- Trigger: mise à jour de carts.updated_at quand cart_items change
CREATE OR REPLACE FUNCTION update_cart_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.cart_id;
        RETURN OLD;
    ELSE
        UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.cart_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cart_on_item_insert
AFTER INSERT ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_on_item_change();

CREATE TRIGGER trigger_update_cart_on_item_update
AFTER UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_on_item_change();

CREATE TRIGGER trigger_update_cart_on_item_delete
AFTER DELETE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_on_item_change();

-- Vue: cart_summary (calculs totaux par panier)
CREATE OR REPLACE VIEW cart_summary AS
SELECT
    c.id AS cart_id,
    c.user_id,
    c.guest_token,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(ci.id), 0) AS item_count,
    COALESCE(SUM(ci.quantity), 0) AS total_quantity,
    COALESCE(SUM(ci.unit_price * ci.quantity), 0) AS subtotal,
    0 AS taxes,
    COALESCE(SUM(ci.unit_price * ci.quantity), 0) AS total,
    CASE WHEN COUNT(ci.id) = 0 THEN true ELSE false END AS is_empty,
    CASE WHEN c.user_id IS NULL THEN true ELSE false END AS is_guest
FROM carts c
LEFT JOIN cart_items ci ON ci.cart_id = c.id
GROUP BY c.id, c.user_id, c.guest_token, c.created_at, c.updated_at;
