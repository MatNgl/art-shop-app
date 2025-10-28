# État de la Migration Backend/Frontend

**Date**: 2025-10-28 17:15
**Statut Global**: ⚠️ Migration UUID→INTEGER terminée, mais incompatibilités structurelles restantes

---

## ✅ Ce qui a été fait

### 1. Migration UUID → INTEGER (TERMINÉ)
- ✅ Base de données: Tous les IDs convertis de UUID vers SERIAL (INTEGER)
- ✅ Entities: Tous les `@PrimaryGeneratedColumn('uuid')` → `@PrimaryGeneratedColumn()`
- ✅ Services: Tous les `id: string` → `id: number`
- ✅ Controllers: Tous les `ParseUUIDPipe` → `ParseIntPipe`
- ✅ DTOs: Tous les `@IsUUID()` → `@IsNumber()`
- ✅ Compilation: **0 erreurs TypeScript**
- ✅ Backend démarré avec succès

### 2. Tests Validés
- ✅ `/api/categories/tree` fonctionne avec INTEGER IDs

---

## ❌ Ce qui reste à faire

### Module Categories (60% compatible)

#### Champs manquants dans le backend:
```typescript
// Frontend Category interface
interface Category {
  id: number;              // ✅ OK maintenant
  name: string;            // ✅ OK
  slug: string;            // ✅ OK
  description: string;     // ✅ OK
  parentId: number | null; // ✅ OK
  children?: Category[];   // ✅ OK
  imageUrl?: string;       // ✅ OK
  isActive: boolean;       // ✅ OK

  // ❌ MANQUANTS:
  color: string;           // Format hex #RRGGBB
  icon: string;            // Nom de l'icône
  bannerImage?: string;    // URL de la bannière
  productIds?: number[];   // Tableau d'IDs de produits associés
}
```

#### Actions nécessaires:
1. Ajouter colonnes SQL: `color`, `icon`, `banner_image_url`
2. Ajouter propriétés dans `category.entity.ts`
3. Ajouter validation dans `create-category.dto.ts`

---

### Module Products (30% compatible) - CRITIQUE

Le module Products backend est **complètement différent** du frontend. Il manque énormément de champs.

#### Champs manquants dans le backend:
```typescript
// Ce que le frontend attend:
interface Product {
  id: number;                    // ✅ OK
  title: string;                 // ❌ Backend a "name"
  name?: string;                 // ✅ OK
  description: string;           // ✅ OK

  // Pricing - STRUCTURE DIFFÉRENTE
  originalPrice: number;         // ❌ Backend a "basePrice"
  reducedPrice?: number;         // ❌ MANQUANT
  hasPromotion?: boolean;        // ❌ MANQUANT
  discount?: number;             // ❌ MANQUANT

  // Categories - SYSTÈME MULTIPLE
  categoryId: number;            // ✅ OK
  subCategoryIds?: number[];     // ❌ MANQUANT
  categoryAssociations?: [];     // ❌ MANQUANT (table créée mais pas mappée)

  // Rich data
  tags: string[];                // ❌ MANQUANT (devrait être TEXT[])
  imageUrl: string;              // ✅ OK
  images: string[];              // ❌ MANQUANT (tableau d'images)
  technique: string;             // ❌ MANQUANT
  dimensions: {                  // ❌ MANQUANT (devrait être JSONB)
    width: number;
    height: number;
    depth?: number;
    unit: string;
  };
  formatId?: number;             // ❌ MANQUANT

  // Stock
  isAvailable: boolean;          // ✅ OK
  stock: number;                 // ✅ OK (stockQuantity)

  // Limited edition
  isLimitedEdition: boolean;     // ❌ MANQUANT
  editionNumber?: number;        // ❌ MANQUANT
  totalEditions?: number;        // ❌ MANQUANT

  // Variants
  variants?: ProductVariant[];   // ❌ Table créée mais pas mappée
}
```

#### Actions nécessaires:
1. **Refonte complète du module Products**
2. Ajouter colonnes SQL manquantes
3. Mapper la relation avec `product_variants`
4. Mapper la relation avec `product_category_associations`
5. Ajouter tous les champs JSONB et arrays

---

### Module Formats (70% compatible)

#### Champs manquants:
```typescript
interface PrintFormat {
  id: number;        // ✅ OK
  name: string;      // ✅ OK
  width: number;     // ✅ OK
  height: number;    // ✅ OK
  unit: string;      // ✅ OK

  // ❌ MANQUANTS:
  slug: string;      // Pour les URLs friendly
  type?: string;     // Type de format (portrait, paysage, carré)
  isActive: boolean; // Pour activer/désactiver des formats
  description?: string; // Description du format
}
```

#### Actions nécessaires:
1. Ajouter colonnes: `slug`, `type`, `is_active`, `description`
2. Ajouter propriétés dans l'entity
3. Ajouter validation dans le DTO

---

### Module Users (80% compatible)

#### Champs manquants:
```typescript
interface User {
  // Tous les champs de base OK ✅

  // ❌ MANQUANTS (tables créées mais pas mappées):
  addresses: Address[];        // Relation OneToMany vers user_addresses
  paymentMethods: PaymentMethod[]; // Relation OneToMany vers user_payment_methods
}
```

#### Actions nécessaires:
1. Mapper les relations dans `user.entity.ts`
2. Créer les DTOs pour Address et PaymentMethod
3. Ajouter les endpoints pour gérer addresses et payment methods

---

### Module Orders (100% compatible) ✅

Le module Orders est **parfaitement compatible** avec le frontend. Rien à faire.

---

## 📊 Résumé des Priorités

### 🔴 PRIORITÉ HAUTE
1. **Products Module**: Refonte complète (30% → 100%)
   - Impact: Critique, le frontend ne peut pas afficher les produits correctement
   - Effort: ~3-4 heures

### 🟡 PRIORITÉ MOYENNE
2. **Categories Module**: Ajouter 4 champs manquants (60% → 100%)
   - Impact: Moyen, l'UI des catégories manque de fonctionnalités
   - Effort: ~30 minutes

3. **Formats Module**: Ajouter 4 champs manquants (70% → 100%)
   - Impact: Moyen, gestion des formats limitée
   - Effort: ~20 minutes

### 🟢 PRIORITÉ BASSE
4. **Users Module**: Mapper les relations existantes (80% → 100%)
   - Impact: Faible, les fonctionnalités de base marchent
   - Effort: ~1 heure

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Migration UUID→INTEGER (✅ FAIT)
- Migration base de données
- Migration code
- Tests de compilation

### Phase 2: Module Products (⏭️ EN ATTENTE)
1. Créer migration SQL avec tous les nouveaux champs
2. Mettre à jour `product.entity.ts`
3. Créer/mettre à jour les DTOs
4. Mapper les relations (variants, categoryAssociations)
5. Tester tous les endpoints Products

### Phase 3: Modules Categories & Formats (⏭️ EN ATTENTE)
1. Ajouter les champs manquants dans les migrations SQL
2. Mettre à jour les entities
3. Mettre à jour les DTOs
4. Tester les endpoints

### Phase 4: Module Users (⏭️ EN ATTENTE)
1. Mapper les relations dans l'entity
2. Créer les endpoints pour addresses/paymentMethods
3. Tester

### Phase 5: Tests E2E (⏭️ EN ATTENTE)
1. Tester tous les endpoints avec INTEGER IDs
2. Valider la compatibilité frontend/backend
3. Tests d'intégration

---

## ⚠️ Estimation Temps Restant

- **Phase 2 (Products)**: 3-4 heures
- **Phase 3 (Categories + Formats)**: 1 heure
- **Phase 4 (Users)**: 1 heure
- **Phase 5 (Tests)**: 2 heures

**Total estimé**: ~7-8 heures de travail
