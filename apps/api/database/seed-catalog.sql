-- Seed data for Catalog (Products, Categories, Formats)

-- Catégories
INSERT INTO categories (name, slug, description, parent_id, created_at, updated_at) VALUES
('Peintures', 'peintures', 'Collection de peintures originales et reproductions', NULL, NOW(), NOW()),
('Photographies', 'photographies', 'Photographies d''art et portraits', NULL, NOW(), NOW()),
('Illustrations', 'illustrations', 'Illustrations numériques et traditionnelles', NULL, NOW(), NOW()),
('Art Abstrait', 'art-abstrait', 'Œuvres abstraites modernes', 1, NOW(), NOW()),
('Paysages', 'paysages', 'Paysages et nature', 1, NOW(), NOW()),
('Portraits', 'portraits', 'Portraits artistiques', 2, NOW(), NOW()),
('Nature', 'nature', 'Photographies de nature', 2, NOW(), NOW());

-- Formats d'impression
INSERT INTO print_formats (name, slug, width, height, unit, type, price_modifier, is_available, created_at, updated_at) VALUES
('A4', 'a4', 21, 29.7, 'cm', 'standard', 0, true, NOW(), NOW()),
('A3', 'a3', 29.7, 42, 'cm', 'standard', 10, true, NOW(), NOW()),
('A2', 'a2', 42, 59.4, 'cm', 'standard', 25, true, NOW(), NOW()),
('A1', 'a1', 59.4, 84.1, 'cm', 'standard', 50, true, NOW(), NOW()),
('30x40', '30x40', 30, 40, 'cm', 'custom', 15, true, NOW(), NOW()),
('50x70', '50x70', 50, 70, 'cm', 'custom', 35, true, NOW(), NOW()),
('60x80', '60x80', 60, 80, 'cm', 'custom', 45, true, NOW(), NOW());

-- Produits
INSERT INTO products (name, slug, description, price, category_id, stock, image_url, is_available, created_at, updated_at) VALUES
('Sunset Over Mountains', 'sunset-over-mountains', 'Magnifique coucher de soleil sur les montagnes', 49.99, 5, 25, '/assets/products/IMG_3900.JPG', true, NOW(), NOW()),
('Abstract Flow', 'abstract-flow', 'Composition abstraite avec des flux de couleurs', 79.99, 4, 15, '/assets/products/IMG_3927.JPG', true, NOW(), NOW()),
('Urban Portrait', 'urban-portrait', 'Portrait moderne en milieu urbain', 69.99, 6, 10, '/assets/products/IMG_3930.JPG', true, NOW(), NOW()),
('Forest Path', 'forest-path', 'Chemin mystérieux dans la forêt', 59.99, 7, 30, '/assets/products/IMG_3931.JPG', true, NOW(), NOW()),
('Golden Hour', 'golden-hour', 'Paysage capturé pendant l''heure dorée', 54.99, 5, 20, '/assets/products/IMG_3959.JPG', true, NOW(), NOW()),
('Modern Architecture', 'modern-architecture', 'Photographie d''architecture contemporaine', 64.99, 2, 18, '/assets/products/IMG_4054.JPG', true, NOW(), NOW()),
('Minimalist Desert', 'minimalist-desert', 'Désert minimaliste aux tons chauds', 74.99, 4, 12, '/assets/products/desert.JPG', true, NOW(), NOW()),
('Majestic Tiger', 'majestic-tiger', 'Portrait puissant d''un tigre', 89.99, 6, 8, '/assets/products/tiger.JPG', true, NOW(), NOW()),
('Ocean Waves', 'ocean-waves', 'Vagues océaniques en mouvement', 59.99, 7, 22, '/assets/products/IMG_5378.JPG', true, NOW(), NOW()),
('City Lights', 'city-lights', 'Vue nocturne de la ville illuminée', 69.99, 2, 16, '/assets/products/IMG_6034.JPG', true, NOW(), NOW());

-- Associations produits-formats (product_formats)
INSERT INTO product_formats (product_id, format_id, price_override, created_at, updated_at)
SELECT p.id, f.id, NULL, NOW(), NOW()
FROM products p
CROSS JOIN print_formats f
WHERE f.slug IN ('a4', 'a3', '30x40');

SELECT 'Catalog seeded successfully!' as message;
SELECT COUNT(*) as "Categories created" FROM categories;
SELECT COUNT(*) as "Formats created" FROM print_formats;
SELECT COUNT(*) as "Products created" FROM products;
