# Analyse des Incompatibilités Backend/Frontend - Module Orders

## ⚠️ PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. Structure de l'Entité Order

#### Backend (Créé)
```typescript
interface Order {
  id: string;              // UUID
  userId: string;          // UUID
  status: OrderStatus;     // 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number;     // UN SEUL montant total
  shippingAddress: string; // Texte simple
  billingAddress: string;  // Texte simple
  paymentMethod: string;   // String simple
  trackingNumber: string;
  notes: string;
  shippedAt: Date;
  deliveredAt: Date;
}
```

#### Frontend (Existant)
```typescript
interface Order {
  id: string;              // Format "ORD-2025-0001"
  userId: number | null;   // NUMBER, pas UUID
  items: OrderItem[];      // ❌ MANQUANT BACKEND
  subtotal: number;        // ❌ MANQUANT BACKEND
  taxes: number;           // ❌ MANQUANT BACKEND
  shipping: number;        // ❌ MANQUANT BACKEND
  total: number;
  status: OrderStatus;     // 'pending' | 'processing' | 'accepted' | 'refused' | 'delivered'
  customer: CustomerInfo;  // ❌ OBJET STRUCTURÉ, pas string simple
  payment: PaymentInfo;    // ❌ OBJET STRUCTURÉ avec last4, brand
  notes?: string;
  orderType?: OrderType;   // ❌ MANQUANT BACKEND ('product' | 'subscription')
  subscriptionId?: string; // ❌ MANQUANT BACKEND
}
```

---

## 🔴 Différences Critiques

### 1. OrderItems (Items de commande)
**Frontend**: Chaque commande contient un tableau `items[]` avec :
```typescript
interface OrderItem {
  productId: number;
  variantId?: number;
  variantLabel?: string;  // ex: "A4"
  title: string;
  unitPrice: number;
  qty: number;
  imageUrl?: string;
}
```

**Backend**: ❌ **AUCUNE gestion des items**
- Pas d'entité OrderItem
- Pas de table order_items
- Pas de relation OneToMany

**Impact**:
- ❌ Impossible de savoir ce qui a été commandé
- ❌ Impossible de calculer le subtotal
- ❌ Impossible d'afficher les détails de commande
- ❌ Impossible de gérer les stocks par produit

---

### 2. Informations Client (Customer)
**Frontend**: Objet structuré
```typescript
interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}
```

**Backend**: Deux champs texte simples
```typescript
shippingAddress: string;  // Texte libre
billingAddress: string;   // Texte libre
```

**Impact**:
- ❌ Perte de structure des données
- ❌ Impossible de filtrer par ville/code postal
- ❌ Impossible de pré-remplir depuis le profil utilisateur
- ❌ Pas de séparation prénom/nom pour les exports

---

### 3. Informations de Paiement
**Frontend**: Objet structuré
```typescript
payment: {
  method: 'card' | 'paypal' | 'bank';
  last4?: string;        // 4 derniers chiffres de carte
  brand?: PaymentBrand;  // 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other'
}
```

**Backend**: Un seul champ string
```typescript
paymentMethod: string;  // String libre
```

**Impact**:
- ❌ Perte des 4 derniers chiffres de carte
- ❌ Perte du type de carte (Visa, Mastercard, etc.)
- ❌ Impossible d'afficher les icônes de paiement
- ❌ Difficile de faire des stats par moyen de paiement

---

### 4. Status (Statuts)
**Frontend**:
```typescript
type OrderStatus = 'pending' | 'processing' | 'accepted' | 'refused' | 'delivered';
```

**Backend**:
```typescript
enum OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
```

**Différences**:
- ❌ Frontend: `accepted` / Backend: `confirmed`
- ❌ Frontend: `refused` / Backend: `cancelled`
- ✅ Commun: `pending`, `processing`, `delivered`
- ❌ Backend a `shipped` (pas dans frontend)

**Impact**:
- ❌ Incompatibilité des workflows
- ❌ Le frontend ne comprendra pas `confirmed` et `shipped`
- ❌ Le backend ne comprendra pas `accepted` et `refused`

---

### 5. Montants (Subtotal, Taxes, Shipping)
**Frontend**: Décomposition complète
```typescript
{
  subtotal: 630,   // Somme des produits
  taxes: 0,        // Taxes calculées
  shipping: 12,    // Frais de port
  total: 642       // Total TTC
}
```

**Backend**: Un seul champ
```typescript
{
  totalAmount: 642  // Total uniquement
}
```

**Impact**:
- ❌ Impossible de recalculer le montant HT
- ❌ Impossible d'afficher les frais de port séparément
- ❌ Impossible de faire des stats sur les taxes collectées
- ❌ Impossible de vérifier la cohérence des calculs

---

### 6. ID Format
**Frontend**: Format lisible
```typescript
id: "ORD-2025-0001"  // String formaté
```

**Backend**: UUID
```typescript
id: "550e8400-e29b-41d4-a716-446655440000"  // UUID v4
```

**Impact**:
- ⚠️ Incompatibilité d'affichage
- ⚠️ Frontend attend un format humain pour l'affichage
- ⚠️ Besoin d'un champ `orderNumber` séparé côté backend

---

### 7. User ID Type
**Frontend**:
```typescript
userId: number | null;
```

**Backend**:
```typescript
userId: string;  // UUID
```

**Impact**:
- ❌ Incompatibilité de type
- ❌ Jointures impossibles si User.id est un UUID backend mais number frontend

---

### 8. OrderType (Type de commande)
**Frontend**:
```typescript
orderType?: 'product' | 'subscription';
subscriptionId?: string;
```

**Backend**:
```typescript
// ❌ MANQUANT COMPLÈTEMENT
```

**Impact**:
- ❌ Impossible de distinguer commande produit vs abonnement
- ❌ Impossible de lier à un abonnement
- ❌ Logique métier différente selon le type

---

## 📋 Actions Requises pour Compatibilité

### 🔧 Modifications Backend CRITIQUES

#### 1. Créer l'entité OrderItem
```typescript
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'integer' })
  productId: number;

  @Column({ name: 'variant_id', type: 'integer', nullable: true })
  variantId: number | null;

  @Column({ name: 'variant_label', type: 'varchar', length: 100, nullable: true })
  variantLabel: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'integer' })
  qty: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;
}
```

#### 2. Modifier l'entité Order
```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ Ajouter orderNumber pour affichage humain
  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;  // "ORD-2025-0001"

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  // ✅ Ajouter relation items
  @OneToMany(() => OrderItem, item => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  // ✅ Décomposer les montants
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // ✅ Ajuster enum status
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'accepted', 'refused', 'delivered'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'accepted' | 'refused' | 'delivered';

  // ✅ Structurer customer en JSON
  @Column({ type: 'jsonb' })
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      zip: string;
      country: string;
    };
  };

  // ✅ Structurer payment en JSON
  @Column({ type: 'jsonb' })
  payment: {
    method: 'card' | 'paypal' | 'bank';
    last4?: string;
    brand?: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';
  };

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ✅ Ajouter orderType
  @Column({
    name: 'order_type',
    type: 'enum',
    enum: ['product', 'subscription'],
    default: 'product'
  })
  orderType: 'product' | 'subscription';

  // ✅ Ajouter subscriptionId
  @Column({ name: 'subscription_id', type: 'varchar', length: 100, nullable: true })
  subscriptionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ⚠️ Supprimer shippedAt/deliveredAt si pas utilisés côté frontend
  // Ou les garder en plus si workflow backend nécessaire
}
```

#### 3. Créer CreateOrderDto cohérent
```typescript
export class CreateOrderItemDto {
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsOptional()
  @IsString()
  variantLabel?: string;

  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(1)
  qty: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  taxes: number;

  @IsNumber()
  @Min(0)
  shipping: number;

  @IsNumber()
  @Min(0)
  total: number;

  @IsObject()
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      zip: string;
      country: string;
    };
  };

  @IsObject()
  payment: {
    method: 'card' | 'paypal' | 'bank';
    last4?: string;
    brand?: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';
  };

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['product', 'subscription'])
  orderType?: 'product' | 'subscription';

  @IsOptional()
  @IsString()
  subscriptionId?: string;
}
```

---

## 🔄 Migration de la Base de Données

### 1. Créer table order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    variant_label VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    qty INTEGER NOT NULL,
    image_url TEXT
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 2. Modifier table orders
```sql
-- Ajouter les nouveaux champs
ALTER TABLE orders
  ADD COLUMN order_number VARCHAR(50) UNIQUE,
  ADD COLUMN subtotal DECIMAL(10,2),
  ADD COLUMN taxes DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN shipping DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN customer JSONB,
  ADD COLUMN payment JSONB,
  ADD COLUMN order_type VARCHAR(20) DEFAULT 'product' CHECK (order_type IN ('product', 'subscription')),
  ADD COLUMN subscription_id VARCHAR(100);

-- Modifier le type de status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'accepted', 'refused', 'delivered'));

-- Supprimer les anciens champs incompatibles
ALTER TABLE orders
  DROP COLUMN IF EXISTS shipping_address,
  DROP COLUMN IF EXISTS billing_address,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS tracking_number,
  DROP COLUMN IF EXISTS shipped_at,
  DROP COLUMN IF EXISTS delivered_at,
  DROP COLUMN IF EXISTS total_amount;

-- Renommer total_amount en total si nécessaire
ALTER TABLE orders RENAME COLUMN total_amount TO total;
```

---

## ⚠️ Risques et Limitations Actuelles

### Avec le Backend Actuel (NON Modifié)

1. ❌ **Perte de données**: Les items de commande ne sont pas stockés
2. ❌ **Impossible d'afficher les détails**: Le frontend ne peut pas lister les produits commandés
3. ❌ **Calculs incorrects**: Subtotal/taxes/shipping ne sont pas stockés séparément
4. ❌ **Adresses non structurées**: Impossible de filtrer ou analyser par localisation
5. ❌ **Paiement incomplet**: Perte des informations de carte (last4, brand)
6. ❌ **Statuts incompatibles**: Workflow différent entre front et back
7. ❌ **Type de commande manquant**: Impossible de distinguer produit vs abonnement

### Impact Utilisateur Final

- 🔴 Impossible de voir le détail d'une commande (quels produits, quantités, variantes)
- 🔴 Impossible de générer des factures complètes
- 🔴 Impossible de faire des statistiques produits (best-sellers, etc.)
- 🔴 Workflow de gestion des commandes cassé (statuts différents)
- 🔴 Intégration panier → commande impossible sans mapping complexe

---

## ✅ Recommandations

### Option 1: Refonte Complète Backend (RECOMMANDÉ)
**Avantages**:
- Cohérence totale avec le frontend
- Toutes les fonctionnalités supportées
- Base de données normalisée

**Inconvénients**:
- Nécessite 2-3h de développement
- Migration de données si déjà en production

### Option 2: Adapter le Frontend
**Avantages**:
- Moins de travail backend

**Inconvénients**:
- ❌ Perte de fonctionnalités (items, détails paiement, etc.)
- ❌ Expérience utilisateur dégradée
- ❌ Code frontend complexe avec mapping

### Option 3: Couche d'Abstraction (Adaptateur)
**Avantages**:
- Permet de garder les deux modèles

**Inconvénients**:
- Complexité accrue
- Performance dégradée
- Maintenance difficile

---

## 🎯 Conclusion

**Le backend Orders créé n'est PAS compatible avec le frontend existant.**

Les différences sont trop importantes pour une simple adaptation. Il faut **refaire le backend** en suivant le modèle frontend, qui est beaucoup plus complet et structuré.

**Prochaine étape recommandée**:
Recréer le module Orders backend avec:
1. Entité OrderItem (table order_items)
2. Structure Order complète avec tous les champs frontend
3. Statuts alignés ('accepted' / 'refused' au lieu de 'confirmed' / 'cancelled')
4. DTOs complets avec items, customer structuré, payment structuré
5. Génération de orderNumber (ORD-YYYY-XXXXX)
