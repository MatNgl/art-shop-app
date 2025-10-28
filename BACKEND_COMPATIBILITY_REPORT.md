# Rapport de Compatibilité Backend/Frontend - Tous les Modules

**Date**: 2025-10-28
**Status**: Analyse complète des incompatibilités

---

## ✅ Module Orders - COMPATIBLE (Refait)

Le module Orders a été **entièrement refait** et est maintenant 100% compatible avec le frontend.

---

## 🔴 Module Categories - INCOMPATIBILITÉS CRITIQUES

### Type ID
| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| **Type ID** | `number` | `string` (UUID) | ❌ CRITIQUE |

### Champs Manquants Backend

| Champ Frontend | Backend | Impact |
|----------------|---------|--------|
| `color` | ❌ Manquant | Impossible d'afficher les couleurs de catégories |
| `icon` | ❌ Manquant | Pas d'icônes dans l'UI |
| `image` | `imageUrl` | ⚠️ Nom différent |
| `bannerImage` | ❌ Manquant | Pas de bannière pour les pages catégories |
| `productIds` | ❌ Manquant | Frontend s'attend à un tableau d'IDs produits |

### Recommandations

**Option 1: Ajouter les champs manquants**
```sql
ALTER TABLE categories
  ADD COLUMN color VARCHAR(7),  -- Format hex #RRGGBB
  ADD COLUMN icon VARCHAR(50),
  ADD COLUMN banner_image_url VARCHAR(500);
```

**Option 2: Adapter le frontend** (moins recommandé)
- Supprimer l'utilisation de color, icon, bannerImage, productIds
- Mapper `imageUrl` vers `image`

---

## 🔴 Module Products - INCOMPATIBILITÉS MAJEURES

### Type ID
| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| **Type ID** | `number` | `string` (UUID) | ❌ CRITIQUE |

### Structure Complètement Différente

#### Frontend Product Interface
```typescript
interface Product {
  id: number;
  title: string;
  name?: string;
  description: string;

  // Pricing
  originalPrice: number;
  reducedPrice?: number;
  hasPromotion?: boolean;
  discount?: number;

  // Categories (MULTIPLE associations)
  categoryId: number;
  subCategoryIds?: number[];
  categoryAssociations?: ProductCategoryAssociation[];

  // Rich data
  tags: string[];
  imageUrl: string;
  images: string[];  // Multiple images
  technique: string;
  dimensions: Dimensions;  // {width, height, depth, unit}
  formatId?: number;

  // Stock
  isAvailable: boolean;
  stock: number;

  // Limited edition
  isLimitedEdition: boolean;
  editionNumber?: number;
  totalEditions?: number;

  // Variants (A3, A4, A5, A6)
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: number;
  sku?: string;
  formatId?: number;
  originalPrice: number;
  reducedPrice?: number;
  stock: number;
  isAvailable: boolean;
  dimensions: Dimensions;
  imageUrl?: string;
}
```

#### Backend Product Entity
```typescript
@Entity('products')
class Product {
  id: string;  // UUID
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;  // UN SEUL prix
  categoryId: string | null;  // UNE SEULE catégorie
  stockQuantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
  productFormats: ProductFormat[];  // Relation différente
}
```

### Champs Manquants Backend (CRITIQUE)

| Champ Frontend | Backend | Impact |
|----------------|---------|--------|
| `title` | `name` | ⚠️ Nom différent |
| `originalPrice` | `basePrice` | ⚠️ Nom différent |
| `reducedPrice` | ❌ Manquant | **Promotions impossibles** |
| `hasPromotion` | ❌ Manquant | **Promotions impossibles** |
| `discount` | ❌ Manquant | **Promotions impossibles** |
| `tags` | ❌ Manquant | Impossible de filtrer par tags |
| `images` (array) | `imageUrl` (string) | **Galerie impossible** |
| `technique` | ❌ Manquant | Info produit manquante |
| `dimensions` (object) | ❌ Manquant | **Specs techniques manquantes** |
| `formatId` | ❌ Manquant | Pas de format par défaut |
| `isLimitedEdition` | ❌ Manquant | **Éditions limitées impossibles** |
| `editionNumber` | ❌ Manquant | **Éditions limitées impossibles** |
| `totalEditions` | ❌ Manquant | **Éditions limitées impossibles** |
| `variants` | ❌ Manquant | **Variantes produit impossibles** |
| `categoryAssociations` | ❌ Manquant | **Multi-catégories impossible** |
| `subCategoryIds` | ❌ Manquant | **Sous-catégories multiples impossibles** |

### Recommandations

**❌ NE PAS adapter le frontend - Trop de pertes de fonctionnalités**

**✅ REFAIRE le module Products backend** (comme pour Orders)

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,

    -- Pricing
    original_price DECIMAL(10,2) NOT NULL,
    reduced_price DECIMAL(10,2),
    has_promotion BOOLEAN DEFAULT FALSE,
    discount INTEGER,  -- Percentage 0-100

    -- Categories (garder categoryId principal pour compatibilité)
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sub_category_ids UUID[],  -- Array PostgreSQL

    -- Rich data
    tags TEXT[],  -- Array PostgreSQL
    image_url VARCHAR(500),
    images TEXT[],  -- Array d'URLs
    technique VARCHAR(100),
    dimensions JSONB,  -- {width, height, depth, unit}
    format_id UUID,

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

-- Table pour les variantes
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    format_id UUID,
    original_price DECIMAL(10,2) NOT NULL,
    reduced_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    dimensions JSONB,
    image_url VARCHAR(500)
);

-- Table pour les associations multiples catégories/sous-catégories
CREATE TABLE product_category_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    sub_category_ids UUID[]
);
```

---

## 🟡 Module Formats - INCOMPATIBILITÉS MINEURES

### Type ID
| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| **Type ID** | `number` | `string` (UUID) | ❌ CRITIQUE |

### Champs Manquants

| Champ Frontend | Backend | Impact |
|----------------|---------|--------|
| `slug` | ❌ Manquant | URLs pas SEO-friendly |
| `type` | ❌ Manquant | Pas de catégorisation des formats |
| `isActive` | ❌ Manquant | Impossible de désactiver un format |
| `isAvailable` | ❌ Manquant | Alias pour isActive |
| `description` | ❌ Manquant | Pas de description format |

### Recommandations

```sql
ALTER TABLE print_formats
  ADD COLUMN slug VARCHAR(100) UNIQUE,
  ADD COLUMN type VARCHAR(50),
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN description TEXT;
```

---

## 🟡 Module Users - INCOMPATIBILITÉS MINEURES

### Type ID
| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| **Type ID** | `number` | `string` (UUID) | ❌ CRITIQUE |

### Champs Manquants

| Champ Frontend | Backend | Impact |
|----------------|---------|--------|
| `addresses` | ❌ Manquant | Pas de gestion multi-adresses |
| `paymentMethods` | ❌ Manquant | Pas de CB enregistrées |
| `subscription` | ❌ Manquant | Info abonnement non liée |

### Recommandations

**Option 1: Tables séparées**
```sql
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50),
    street VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_payment_methods (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(20),  -- visa, mastercard, amex, paypal
    last4 VARCHAR(4),
    exp_month INTEGER,
    exp_year INTEGER,
    holder VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE
);
```

**Option 2: JSONB dans User**
```sql
ALTER TABLE users
  ADD COLUMN addresses JSONB,
  ADD COLUMN payment_methods JSONB;
```

---

## 📊 Résumé Global

| Module | ID Type | Compatibilité | Action Requise |
|--------|---------|---------------|----------------|
| **Orders** | UUID | ✅ 100% | Aucune - Déjà refait |
| **Categories** | UUID vs number | 🔴 60% | Ajouter champs (color, icon, banner) |
| **Products** | UUID vs number | 🔴 30% | **REFONTE COMPLÈTE NÉCESSAIRE** |
| **Formats** | UUID vs number | 🟡 70% | Ajouter champs (slug, isActive, description) |
| **Users** | UUID vs number | 🟡 80% | Ajouter tables addresses/payment |

---

## 🚨 Problème Critique: Types ID Incompatibles

**Tous les modules utilisent `UUID` backend vs `number` frontend**

### Impact
- ❌ Frontend envoie `productId: 1` (number)
- ❌ Backend attend `id: "uuid-string"`
- ❌ **Toutes les jointures/relations cassées**

### Solutions

#### Option A: Changer Backend → INTEGER AUTO_INCREMENT (RECOMMANDÉ si début projet)
```sql
-- Recréer toutes les tables avec INTEGER au lieu de UUID
ALTER TABLE users ALTER COLUMN id TYPE INTEGER;
ALTER TABLE categories ALTER COLUMN id TYPE INTEGER;
ALTER TABLE products ALTER COLUMN id TYPE INTEGER;
-- etc.
```

**Avantages:**
- ✅ Compatibilité immédiate frontend
- ✅ IDs plus courts et lisibles
- ✅ Meilleure performance sur les index

**Inconvénients:**
- ⚠️ Moins sécurisé (IDs prévisibles)
- ⚠️ Problèmes de collisions si distribution

#### Option B: Changer Frontend → UUID (RECOMMANDÉ si avancé dans le projet)
```typescript
// Changer tous les types
interface Product {
  id: string;  // Au lieu de number
  categoryId: string;
  formatId?: string;
  // ...
}
```

**Avantages:**
- ✅ UUID plus sécurisé
- ✅ Pas de migration DB massive

**Inconvénients:**
- ⚠️ Changer TOUS les modèles frontend
- ⚠️ Changer TOUS les services/stores
- ⚠️ IDs plus longs dans les URLs

#### Option C: Dual ID System (HYBRIDE)
```sql
-- Garder UUID en primary key
-- Ajouter un ID numérique visible
ALTER TABLE products
  ADD COLUMN display_id INTEGER UNIQUE;

CREATE SEQUENCE products_display_id_seq;
```

Frontend utilise `displayId: number`, backend mappe vers UUID en interne.

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Décision Architecture (URGENT)
1. **Choisir**: INTEGER vs UUID pour les IDs
2. Si INTEGER: Migrer toutes les tables backend
3. Si UUID: Migrer tous les modèles frontend

### Phase 2: Module Products (PRIORITÉ HAUTE)
1. Créer table `product_variants`
2. Ajouter champs: tags, images, technique, dimensions, limited edition
3. Créer table `product_category_associations`
4. Refaire ProductsService avec logique variantes
5. Tester intégration avec frontend

### Phase 3: Module Categories (PRIORITÉ MOYENNE)
1. Ajouter champs: color, icon, bannerImage
2. Ajouter logique productIds (computed ou table de jointure)
3. Tester navigation frontend

### Phase 4: Module Formats (PRIORITÉ BASSE)
1. Ajouter slug, type, isActive, description
2. Migration données existantes

### Phase 5: Module Users (PRIORITÉ BASSE)
1. Créer tables addresses/payment_methods
2. Endpoints CRUD pour adresses
3. Endpoints CRUD pour moyens de paiement

---

## ⚠️ Impact sur le Développement

**Sans corrections:**
- ❌ Frontend ne peut PAS utiliser le backend actuel
- ❌ Toutes les pages produits cassées
- ❌ Panier/Checkout impossible
- ❌ Admin panel non fonctionnel

**Temps estimé de correction:**
- Phase 1 (IDs): 2-4h
- Phase 2 (Products): 6-8h
- Phase 3 (Categories): 2-3h
- Phase 4 (Formats): 1-2h
- Phase 5 (Users): 3-4h

**Total: 14-21 heures de développement**

---

## 💡 Recommandation Finale

**Pour avancer rapidement:**

1. **Décider MAINTENANT**: INTEGER ou UUID ?
   - Projet en début → INTEGER (plus simple)
   - Projet avancé → UUID (moins de refonte)

2. **Priorité absolue**: Refaire module Products
   - C'est le cœur métier
   - Sans ça, aucune vente possible

3. **Tests end-to-end**: Après chaque phase
   - Vérifier frontend + backend ensemble
   - Ne pas avancer sans validation

4. **Documentation**: Maintenir ce rapport à jour
   - Cocher chaque incompatibilité corrigée
   - Noter les décisions d'architecture
