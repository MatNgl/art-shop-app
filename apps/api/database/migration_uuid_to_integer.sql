-- ============================================
-- MIGRATION UUID → INTEGER
-- ============================================
-- ATTENTION : Cette migration supprime TOUTES les données existantes
-- Faire un backup avant d'exécuter !

-- Drop toutes les tables avec CASCADE
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_formats CASCADE;
DROP TABLE IF EXISTS print_formats CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    suspended_at TIMESTAMP,
    suspended_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    suspension_reason TEXT,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    color VARCHAR(7),  -- Format hex #RRGGBB
    icon VARCHAR(50),
    banner_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: print_formats
-- ============================================
CREATE TABLE print_formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    type VARCHAR(50),
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10) DEFAULT 'cm',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: products (STRUCTURE COMPLÈTE)
-- ============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,

    -- Pricing
    original_price DECIMAL(10,2) NOT NULL,
    reduced_price DECIMAL(10,2),
    has_promotion BOOLEAN DEFAULT FALSE,
    discount INTEGER CHECK (discount >= 0 AND discount <= 100),

    -- Categories
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

    -- Rich data
    tags TEXT[],
    image_url VARCHAR(500),
    images TEXT[],
    technique VARCHAR(100),
    dimensions JSONB,  -- {width, height, depth, unit}
    format_id INTEGER REFERENCES print_formats(id) ON DELETE SET NULL,

    -- Stock
    is_available BOOLEAN DEFAULT TRUE,
    stock INTEGER DEFAULT 0,

    -- Limited edition
    is_limited_edition BOOLEAN DEFAULT FALSE,
    edition_number INTEGER,
    total_editions INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: product_variants
-- ============================================
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    format_id INTEGER REFERENCES print_formats(id) ON DELETE SET NULL,
    original_price DECIMAL(10,2) NOT NULL,
    reduced_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    dimensions JSONB,  -- {width, height, depth, unit}
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: product_category_associations
-- ============================================
CREATE TABLE product_category_associations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    sub_category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(product_id, category_id, sub_category_id)
);

-- ============================================
-- TABLE: orders (STRUCTURE FRONTEND)
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    taxes DECIMAL(10,2) DEFAULT 0,
    shipping DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'accepted', 'refused', 'delivered')),
    customer JSONB NOT NULL,
    payment JSONB NOT NULL,
    notes TEXT,
    order_type VARCHAR(20) DEFAULT 'product' CHECK (order_type IN ('product', 'subscription')),
    subscription_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    variant_label VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    qty INTEGER NOT NULL,
    image_url TEXT
);

-- ============================================
-- TABLE: user_addresses
-- ============================================
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50),
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: user_payment_methods
-- ============================================
CREATE TABLE user_payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(20) NOT NULL CHECK (brand IN ('visa', 'mastercard', 'amex', 'paypal', 'other')),
    last4 VARCHAR(4) NOT NULL,
    exp_month INTEGER NOT NULL CHECK (exp_month >= 1 AND exp_month <= 12),
    exp_year INTEGER NOT NULL,
    holder VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES (Performance)
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Utilisateurs
INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@example.com', '$2b$10$XVHW8MqN.IxJLVQZ8ZqP1.FN8YQZ8ZqP1.FN8YQZ8ZqP1.FN8YQZ8ZqP', 'Matthéo', 'Naegellen', '0611223344', 'admin'),
('user@example.com', '$2b$10$XVHW8MqN.IxJLVQZ8ZqP1.FN8YQZ8ZqP1.FN8YQZ8ZqP1.FN8YQZ8ZqP', 'Nathan', 'Naegellen', '0655443322', 'user');

-- Catégories
INSERT INTO categories (name, slug, description, color, icon) VALUES
('Peinture', 'peinture', 'Art de la peinture', '#FF5733', 'palette'),
('Sculpture', 'sculpture', 'Art de la sculpture', '#33C4FF', 'cube'),
('Photographie', 'photographie', 'Art de la photographie', '#FFD733', 'camera');

-- Sous-catégories
INSERT INTO categories (name, slug, description, parent_id, color, icon) VALUES
('Huile', 'huile', 'Peinture à l''huile', 1, '#FF6B4A', 'droplet'),
('Acrylique', 'acrylique', 'Peinture acrylique', 1, '#FF8F66', 'droplet'),
('Aquarelle', 'aquarelle', 'Peinture aquarelle', 1, '#FFA385', 'droplet');

-- Formats
INSERT INTO print_formats (name, slug, type, width, height, unit, is_active) VALUES
('A4', 'a4', 'standard', 21, 29.7, 'cm', TRUE),
('A3', 'a3', 'standard', 29.7, 42, 'cm', TRUE),
('A5', 'a5', 'standard', 14.8, 21, 'cm', TRUE),
('Marque-page', 'marque-page', 'custom', 21, 7, 'cm', TRUE);

COMMENT ON TABLE users IS 'Utilisateurs de l''application';
COMMENT ON TABLE categories IS 'Catégories hiérarchiques (support parent-child)';
COMMENT ON TABLE products IS 'Produits avec support variants, tags, images multiples, éditions limitées';
COMMENT ON TABLE product_variants IS 'Variantes de produits (A3, A4, A5, A6)';
COMMENT ON TABLE orders IS 'Commandes avec structure compatible frontend';
COMMENT ON TABLE order_items IS 'Items de commandes avec support variantes';
