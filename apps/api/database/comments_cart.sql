-- Commentaires en français pour les tables Cart

-- Table: carts
COMMENT ON TABLE carts IS 'Paniers utilisateurs et invités - Réplique CartStore frontend avec persistence BDD';

COMMENT ON COLUMN carts.id IS 'Identifiant unique du panier (UUID)';
COMMENT ON COLUMN carts.user_id IS 'ID de l''utilisateur propriétaire (null pour panier invité)';
COMMENT ON COLUMN carts.guest_token IS 'Token unique pour panier invité (null pour utilisateur connecté)';
COMMENT ON COLUMN carts.created_at IS 'Date de création du panier';
COMMENT ON COLUMN carts.updated_at IS 'Date de dernière modification (auto-update via triggers)';

-- Table: cart_items
COMMENT ON TABLE cart_items IS 'Lignes du panier - Items individuels (produits + variantes)';

COMMENT ON COLUMN cart_items.id IS 'Identifiant unique de la ligne (UUID)';
COMMENT ON COLUMN cart_items.cart_id IS 'ID du panier parent';
COMMENT ON COLUMN cart_items.kind IS 'Type de ligne (product = produit standard, subscription = abonnement)';
COMMENT ON COLUMN cart_items.product_id IS 'ID du produit';
COMMENT ON COLUMN cart_items.variant_id IS 'ID de la variante (format A3, A4, custom...) - optionnel';
COMMENT ON COLUMN cart_items.title IS 'Nom du produit (snapshot dénormalisé pour affichage même si produit supprimé)';
COMMENT ON COLUMN cart_items.image_url IS 'URL de l''image produit (snapshot)';
COMMENT ON COLUMN cart_items.variant_label IS 'Label de la variante (ex: "A4 (21 × 29.7 cm)") - snapshot';
COMMENT ON COLUMN cart_items.artist_name IS 'Nom de l''artiste (snapshot) - optionnel';
COMMENT ON COLUMN cart_items.category_slug IS 'Slug de la catégorie (snapshot) - optionnel';
COMMENT ON COLUMN cart_items.unit_price IS 'Prix unitaire au moment de l''ajout (snapshot)';
COMMENT ON COLUMN cart_items.quantity IS 'Quantité commandée (1-99)';
COMMENT ON COLUMN cart_items.max_stock IS 'Stock disponible au moment de l''ajout (snapshot)';
COMMENT ON COLUMN cart_items.created_at IS 'Date d''ajout de l''item au panier';
COMMENT ON COLUMN cart_items.updated_at IS 'Date de dernière modification (auto-update via triggers)';

-- Vue: cart_summary
COMMENT ON VIEW cart_summary IS 'Vue récapitulative des paniers avec totaux calculés (item_count, subtotal, total, etc.)';

COMMENT ON COLUMN cart_summary.cart_id IS 'ID du panier';
COMMENT ON COLUMN cart_summary.user_id IS 'ID utilisateur (null pour invité)';
COMMENT ON COLUMN cart_summary.guest_token IS 'Token invité (null pour utilisateur)';
COMMENT ON COLUMN cart_summary.item_count IS 'Nombre de lignes distinctes dans le panier';
COMMENT ON COLUMN cart_summary.total_quantity IS 'Quantité totale d''articles (somme des quantités)';
COMMENT ON COLUMN cart_summary.subtotal IS 'Sous-total (somme des prix)';
COMMENT ON COLUMN cart_summary.taxes IS 'Taxes (actuellement 0, prévu pour TVA future)';
COMMENT ON COLUMN cart_summary.total IS 'Total du panier (subtotal + taxes)';
COMMENT ON COLUMN cart_summary.is_empty IS 'Panier vide ? (true/false)';
COMMENT ON COLUMN cart_summary.is_guest IS 'Panier invité ? (true/false)';
