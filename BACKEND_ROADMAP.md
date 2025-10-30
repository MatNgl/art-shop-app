# 🗺️ Backend Roadmap - Art Shop API

> **Date de création** : 29 octobre 2025
> **ORM** : TypeORM + PostgreSQL
> **État actuel** : 73% complété (11/15 tables implémentées)

---

## 📊 État des lieux

### ✅ Modules implémentés (4/10)

| Module | Tables | Endpoints | Status | Sécurité |
|--------|--------|-----------|--------|----------|
| **Auth** | users | 7 | ✅ Complet | ✅ Guards OK |
| **Users** | users, user_addresses, user_payment_methods | 8 | ✅ Complet | 🔴 Missing guards |
| **Catalog** | products, categories, print_formats, variants | 23 | ✅ Complet | 🔴 Missing guards |
| **Orders** | orders, order_items | 9 | ✅ Complet | 🟡 Partial guards |

### ❌ Modules manquants (6/10)

| Module | Priorité | Estimé | Bloquant frontend |
|--------|----------|--------|-------------------|
| **Favorites** | 🔴 P0 | 1 jour | Oui - page favoris |
| **Promotions** | 🔴 P0 | 2 jours | Oui - checkout/panier |
| **Fidelity** | 🟠 P1 | 2 jours | Oui - programme fidélité |
| **Subscriptions** | 🟠 P1 | 3 jours | Oui - abonnements |
| **Notifications** | 🟡 P2 | 1 jour | Oui - admin dashboard |
| **Messaging** | 🟡 P2 | 2 jours | Oui - admin messaging |

### 🔐 Problèmes de sécurité critiques

| Issue | Fichiers affectés | Impact | Priorité |
|-------|-------------------|--------|----------|
| **Endpoints admin publics** | users.controller.ts, products.controller.ts, categories.controller.ts | N'importe qui peut créer/modifier/supprimer | 🔴 CRITIQUE |
| **Pas de vérification de rôle** | Tous les controllers | User peut accéder aux routes admin | 🔴 CRITIQUE |
| **Pas de refresh token rotation** | auth.service.ts | Tokens compromis restent valides | 🟠 HAUTE |
| **Pas de rate limiting** | main.ts | Vulnérable aux attaques brute-force | 🟠 HAUTE |

---

## 🎯 Plan d'action professionnel

### Phase 0 : Sécurisation (URGENT) ⚠️
**Durée estimée : 1 jour**
**Bloquant : OUI - à faire AVANT tout le reste**

#### Tâche 0.1 : Protéger les routes admin (2h)
- [ ] Ajouter `@UseGuards(JwtAuthGuard, RolesGuard)` sur tous les endpoints admin
- [ ] Ajouter `@Roles(UserRole.ADMIN)` sur les mutations (POST, PUT, PATCH, DELETE)
- [ ] Vérifier que `RolesGuard` est bien appliqué dans l'ordre correct

**Fichiers à modifier :**
```
src/modules/users/users.controller.ts
src/modules/catalog/products.controller.ts
src/modules/catalog/categories.controller.ts
src/modules/catalog/formats.controller.ts
src/modules/orders/orders.controller.ts
```

**Pattern à appliquer :**
```typescript
// Lecture publique (ou user authentifié)
@Get()
@Public() // OU @UseGuards(JwtAuthGuard)
findAll() { ... }

// Mutations = Admin uniquement
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiSecurity('bearer')
create(@Body() dto: CreateDto) { ... }
```

#### Tâche 0.2 : Rate limiting (1h)
- [ ] Installer `@nestjs/throttler`
- [ ] Configurer globalement (100 req/min par IP)
- [ ] Limiter strictement `/auth/login` (5 req/min)
- [ ] Limiter `/auth/register` (3 req/10min)

**Code à ajouter dans `app.module.ts` :**
```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requêtes
    }]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
```

#### Tâche 0.3 : Refresh token rotation (2h)
- [ ] Créer table `refresh_tokens` (jti, user_id, expires_at, revoked)
- [ ] Modifier `auth.service.ts` pour stocker les refresh tokens
- [ ] Endpoint `/auth/logout` révoque le token
- [ ] Endpoint `/auth/refresh` valide + rotation du token

#### Tâche 0.4 : Validation & sanitization (1h)
- [ ] Installer `class-sanitizer` (ou `sanitize-html`)
- [ ] Créer decorator `@Sanitize()` pour les champs texte
- [ ] Appliquer sur tous les DTOs avec `description`, `content`, etc.

**Validation checklist :**
- ✅ Email format : `@IsEmail()`
- ✅ Longueur min/max : `@MinLength()`, `@MaxLength()`
- ✅ Types : `@IsString()`, `@IsNumber()`, `@IsInt()`
- ✅ Téléphone français : `@Matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)`
- ❌ **Manquant** : XSS sanitization sur champs HTML

---

### Phase 1 : Modules critiques (P0) 🔴
**Durée estimée : 5 jours**

---

#### Module 1.1 : FAVORITES (1 jour)

**Objectif :** Permettre aux users de sauvegarder leurs produits favoris.

**Table SQL (déjà créée) :**
```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
```

##### Tâche 1.1.1 : Créer l'entity (30min)
```bash
# Créer le dossier
mkdir -p src/modules/favorites

# Fichiers à créer
src/modules/favorites/entities/favorite.entity.ts
```

**Code entity :**
```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../catalog/entities/product.entity';

@Entity('favorites')
@Unique(['userId', 'productId']) // Constraint unique
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

##### Tâche 1.1.2 : Créer le service (1h)
```typescript
// src/modules/favorites/favorites.service.ts
@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favRepo: Repository<Favorite>,
  ) {}

  async toggle(userId: number, productId: number): Promise<{ added: boolean }> {
    const existing = await this.favRepo.findOne({ where: { userId, productId } });

    if (existing) {
      await this.favRepo.remove(existing);
      return { added: false };
    }

    const favorite = this.favRepo.create({ userId, productId });
    await this.favRepo.save(favorite);
    return { added: true };
  }

  async findByUser(userId: number): Promise<number[]> {
    const favorites = await this.favRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map(f => f.productId);
  }

  async isFavorite(userId: number, productId: number): Promise<boolean> {
    const count = await this.favRepo.count({ where: { userId, productId } });
    return count > 0;
  }
}
```

##### Tâche 1.1.3 : Créer le controller (30min)
```typescript
// src/modules/favorites/favorites.controller.ts
@Controller('favorites')
@ApiTags('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user favorites (product IDs)' })
  async getUserFavorites(@CurrentUser() user: User): Promise<number[]> {
    return this.favService.findByUser(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to favorites' })
  async addFavorite(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ added: boolean }> {
    return this.favService.toggle(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ added: boolean }> {
    return this.favService.toggle(user.id, productId);
  }
}
```

##### Tâche 1.1.4 : Créer le module (15min)
```typescript
// src/modules/favorites/favorites.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Favorite])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

// Ajouter dans app.module.ts
import { FavoritesModule } from './modules/favorites/favorites.module';
imports: [..., FavoritesModule]
```

**Endpoints créés :**
- `GET /api/favorites` → Liste des IDs favoris du user
- `POST /api/favorites/:productId` → Ajouter/retirer du favoris
- `DELETE /api/favorites/:productId` → Retirer du favoris

---

#### Module 1.2 : PROMOTIONS (2 jours)

**Objectif :** Système de codes promo (coupons) et promotions automatiques.

**Table SQL (déjà créée) :**
```sql
CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'buy_x_get_y', 'shipping_free'
  scope VARCHAR(20) NOT NULL, -- 'site-wide', 'category', 'product'
  discount_type VARCHAR(20), -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2),
  min_amount DECIMAL(10, 2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_stackable BOOLEAN DEFAULT false,
  category_slugs TEXT[], -- array de slugs
  product_ids INTEGER[], -- array de product IDs
  buy_x_get_y_config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### Tâche 1.2.1 : Entity + DTOs (1h)
```typescript
// src/modules/promotions/entities/promotion.entity.ts
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  code: string; // null = promotion automatique

  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed_amount', 'buy_x_get_y', 'shipping_free'],
  })
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'shipping_free';

  @Column({
    type: 'enum',
    enum: ['site-wide', 'category', 'product'],
  })
  scope: 'site-wide' | 'category' | 'product';

  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed'],
    nullable: true,
  })
  discountType: 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minAmount: number;

  @Column({ nullable: true })
  maxUses: number;

  @Column({ default: 0 })
  usedCount: number;

  @Column({ nullable: true })
  validFrom: Date;

  @Column({ nullable: true })
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isStackable: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  categorySlugs: string[];

  @Column({ type: 'int', array: true, nullable: true })
  productIds: number[];

  @Column({ type: 'jsonb', nullable: true })
  buyXGetYConfig: {
    buyQuantity: number;
    getQuantity: number;
    applyOn: 'cheapest' | 'most-expensive';
  };

  @CreateDateColumn()
  createdAt: Date;
}
```

**DTOs à créer :**
```typescript
// create-promotion.dto.ts
export class CreatePromotionDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(50)
  code?: string; // Si null = auto

  @IsEnum(['percentage', 'fixed_amount', 'buy_x_get_y', 'shipping_free'])
  type: string;

  @IsEnum(['site-wide', 'category', 'product'])
  scope: string;

  // ... tous les autres champs avec validation
}

// apply-promotion.dto.ts (pour checkout)
export class ApplyPromotionDto {
  @IsString()
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;
}

class CartItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsString()
  @IsOptional()
  categorySlug?: string;
}
```

##### Tâche 1.2.2 : Service avec logique métier (4h)
```typescript
// src/modules/promotions/promotions.service.ts
@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
  ) {}

  // CRUD basique
  async create(dto: CreatePromotionDto): Promise<Promotion> { ... }
  async findAll(): Promise<Promotion[]> { ... }
  async update(id: number, dto: UpdatePromotionDto): Promise<Promotion> { ... }
  async delete(id: number): Promise<void> { ... }

  // Logique métier critique
  async validateCode(code: string): Promise<{ valid: boolean; promotion?: Promotion; reason?: string }> {
    const promo = await this.promoRepo.findOne({ where: { code, isActive: true } });

    if (!promo) {
      return { valid: false, reason: 'Code invalide' };
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return { valid: false, reason: 'Promotion pas encore active' };
    }

    if (promo.validUntil && now > promo.validUntil) {
      return { valid: false, reason: 'Promotion expirée' };
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false, reason: 'Promotion épuisée' };
    }

    return { valid: true, promotion: promo };
  }

  async applyPromotion(
    promotion: Promotion,
    items: CartItemDto[],
    subtotal: number,
  ): Promise<{
    discountAmount: number;
    affectedItems: number[];
    message: string;
  }> {
    // Vérifier min_amount
    if (promotion.minAmount && subtotal < promotion.minAmount) {
      throw new BadRequestException(
        `Montant minimum requis : ${promotion.minAmount}€`,
      );
    }

    let discountAmount = 0;
    const affectedItems: number[] = [];

    switch (promotion.scope) {
      case 'site-wide':
        discountAmount = this.calculateDiscount(subtotal, promotion);
        affectedItems.push(...items.map(i => i.productId));
        break;

      case 'product':
        const eligibleItems = items.filter(i =>
          promotion.productIds?.includes(i.productId)
        );
        const eligibleTotal = eligibleItems.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0,
        );
        discountAmount = this.calculateDiscount(eligibleTotal, promotion);
        affectedItems.push(...eligibleItems.map(i => i.productId));
        break;

      case 'category':
        const categoryItems = items.filter(i =>
          promotion.categorySlugs?.includes(i.categorySlug || '')
        );
        const categoryTotal = categoryItems.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0,
        );
        discountAmount = this.calculateDiscount(categoryTotal, promotion);
        affectedItems.push(...categoryItems.map(i => i.productId));
        break;

      default:
        throw new BadRequestException('Scope invalide');
    }

    // Buy X Get Y logic
    if (promotion.type === 'buy_x_get_y' && promotion.buyXGetYConfig) {
      const config = promotion.buyXGetYConfig;
      const eligibleItems = items.filter(i =>
        affectedItems.includes(i.productId)
      );
      const totalQty = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
      const sets = Math.floor(totalQty / (config.buyQuantity + config.getQuantity));

      if (sets > 0) {
        const sortedItems = [...eligibleItems].sort((a, b) =>
          config.applyOn === 'cheapest'
            ? a.unitPrice - b.unitPrice
            : b.unitPrice - a.unitPrice,
        );

        let qtyToGift = sets * config.getQuantity;
        for (const item of sortedItems) {
          if (qtyToGift === 0) break;
          const giftQty = Math.min(qtyToGift, item.quantity);
          discountAmount += item.unitPrice * giftQty;
          qtyToGift -= giftQty;
        }
      }
    }

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      affectedItems,
      message: this.getPromotionMessage(promotion, discountAmount),
    };
  }

  private calculateDiscount(amount: number, promo: Promotion): number {
    if (promo.discountType === 'percentage') {
      return (amount * promo.discountValue) / 100;
    }
    if (promo.discountType === 'fixed') {
      return Math.min(promo.discountValue, amount);
    }
    return 0;
  }

  async incrementUsage(promotionId: number): Promise<void> {
    await this.promoRepo.increment({ id: promotionId }, 'usedCount', 1);
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return this.promoRepo
      .createQueryBuilder('promo')
      .where('promo.isActive = :active', { active: true })
      .andWhere('(promo.validFrom IS NULL OR promo.validFrom <= :now)', { now })
      .andWhere('(promo.validUntil IS NULL OR promo.validUntil >= :now)', { now })
      .andWhere('(promo.maxUses IS NULL OR promo.usedCount < promo.maxUses)')
      .getMany();
  }
}
```

##### Tâche 1.2.3 : Controller (1h)
```typescript
// src/modules/promotions/promotions.controller.ts
@Controller('promotions')
@ApiTags('promotions')
export class PromotionsController {
  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePromotionDto): Promise<Promotion> { ... }

  // Public endpoints
  @Post('validate')
  @Public()
  async validateCode(@Body() dto: { code: string }) {
    return this.promotionsService.validateCode(dto.code);
  }

  @Post('apply')
  @Public()
  async applyPromotion(@Body() dto: ApplyPromotionDto) {
    const { valid, promotion, reason } = await this.promotionsService.validateCode(dto.code);

    if (!valid || !promotion) {
      throw new BadRequestException(reason);
    }

    return this.promotionsService.applyPromotion(promotion, dto.items, dto.subtotal);
  }

  @Get('active')
  @Public()
  async getActivePromotions(): Promise<Promotion[]> {
    return this.promotionsService.getActivePromotions();
  }
}
```

**Endpoints créés :**
- `POST /api/promotions` (admin) → Créer promo
- `GET /api/promotions` (admin) → Liste toutes les promos
- `POST /api/promotions/validate` (public) → Valider un code
- `POST /api/promotions/apply` (public) → Appliquer une promo au panier
- `GET /api/promotions/active` (public) → Promos actives automatiques

---

#### Module 1.3 : FIDELITY (2 jours)

**Objectif :** Système de points de fidélité + récompenses.

**Tables SQL à créer :**
```sql
CREATE TABLE fidelity_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- Bronze, Silver, Gold, Platinum
  min_points INTEGER NOT NULL,
  max_points INTEGER,
  multiplier DECIMAL(3, 2) DEFAULT 1.0,
  benefits JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_fidelity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier_id INTEGER REFERENCES fidelity_tiers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fidelity_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'earn', 'redeem', 'expire'
  points INTEGER NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fidelity_rewards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'amount', 'percent', 'shipping', 'gift'
  points_required INTEGER NOT NULL,
  discount_value DECIMAL(10, 2),
  max_uses_per_user INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_rewards_used (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reward_id INTEGER REFERENCES fidelity_rewards(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### Tâche 1.3.1 : Entities (1h)
Créer 5 entities : `FidelityTier`, `UserFidelity`, `FidelityTransaction`, `FidelityReward`, `UserRewardUsed`.

##### Tâche 1.3.2 : Service (3h)
```typescript
// Logique clé
async earnPoints(userId: number, orderId: number, orderAmount: number): Promise<number>;
async redeemReward(userId: number, rewardId: number): Promise<void>;
async getUserBalance(userId: number): Promise<UserFidelity>;
async calculateTier(points: number): Promise<FidelityTier>;
```

##### Tâche 1.3.3 : Controller (1h)
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMyFidelity(@CurrentUser() user: User);

@Get('rewards')
@UseGuards(JwtAuthGuard)
async getAvailableRewards(@CurrentUser() user: User);

@Post('rewards/:id/redeem')
@UseGuards(JwtAuthGuard)
async redeemReward(@CurrentUser() user: User, @Param('id') rewardId: number);
```

**Endpoints créés :**
- `GET /api/fidelity/me` → Points + tier du user
- `GET /api/fidelity/rewards` → Récompenses disponibles
- `POST /api/fidelity/rewards/:id/redeem` → Utiliser une récompense
- `GET /api/fidelity/transactions` → Historique des transactions

---

### Phase 2 : Modules secondaires (P1) 🟠
**Durée estimée : 6 jours**

#### Module 2.1 : SUBSCRIPTIONS (3 jours)
- Entity + Service + Controller
- Logique de facturation récurrente
- Gestion des box mensuelles (Collector)
- Webhook Stripe (optionnel)

#### Module 2.2 : NOTIFICATIONS (1 jour)
- CRUD notifications admin
- WebSocket pour temps réel (optionnel)
- Mark as read/unread

#### Module 2.3 : MESSAGING (2 jours)
- Conversations 1-to-1 entre admins
- CRUD messages
- Unread count

---

### Phase 3 : Enhancements (P2) 🟡
**Durée estimée : 3 jours**

#### 3.1 : Full-text search (1 jour)
```typescript
@Get('search')
async search(@Query('q') query: string, @Query('limit') limit = 20) {
  return this.productsService.fullTextSearch(query, limit);
}
```

#### 3.2 : Advanced filtering (1 jour)
- Price range, format, category, subcategory
- Sorting (newest, oldest, price-asc, price-desc, title)
- Pagination (limit, offset)

#### 3.3 : Admin analytics (1 jour)
```typescript
@Get('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getStats(): Promise<DashboardStats>;
```

---

## 📝 Prompt de reprise professionnel

Utilise ce prompt quand tu reviens travailler sur le backend :

```
# CONTEXTE PROJET

Je travaille sur le backend NestJS d'une application e-commerce d'art (Art Shop).

## État actuel
- **ORM** : TypeORM + PostgreSQL
- **Modules implémentés** : Auth (JWT), Users, Catalog (Products/Categories/Formats), Orders
- **Modules manquants** : Favorites, Promotions, Fidelity, Subscriptions, Notifications, Messaging
- **Problème critique** : Routes admin non protégées (manque guards)

## Architecture
- Monorepo : `apps/web/` (Angular) + `apps/api/` (NestJS)
- Types partagés : `packages/shared/src/index.ts`
- Base de données : 15 tables PostgreSQL (11 implémentées)

## Objectif
Compléter le backend pour qu'il corresponde exactement aux fonctionnalités du frontend Angular.

## Documentation
- Roadmap : `BACKEND_ROADMAP.md` (ce fichier)
- Frontend : `DOCUMENTATION_FRONTEND.md`
- README : `README.md`

## Prochaine tâche
[INDIQUE ICI LA PHASE/MODULE SUR LEQUEL TU TRAVAILLES]

Exemple : "Phase 0 - Tâche 0.1 : Protéger les routes admin"

## Règles strictes
1. ✅ Toujours utiliser TypeORM (pas Prisma)
2. ✅ Respecter la structure existante (entities, DTOs, services, controllers, modules)
3. ✅ Ajouter les guards sur TOUS les endpoints admin (@UseGuards + @Roles)
4. ✅ Valider les DTOs avec class-validator
5. ✅ Documenter avec Swagger (@ApiOperation, @ApiResponse)
6. ✅ Nommer les fichiers en kebab-case (create-user.dto.ts)
7. ✅ Importer les types depuis @art-shop/shared quand possible
8. ❌ NE PAS faire de debug sale qui impacte l'architecture
9. ❌ NE PAS modifier les entities existantes sans raison valide
10. ❌ NE PAS créer de code dupliqué

## Commandes utiles
cd apps/api
npm run start:dev          # Dev avec hot reload
npm run build              # Build production
npm run lint               # ESLint
npm run test               # Tests unitaires

docker-compose up db redis # Juste DB + Redis
npm run db:shell           # PostgreSQL shell
```

---

## 🔄 Pattern de développement

Pour chaque nouveau module, suivre cet ordre :

### 1. Créer la structure
```bash
cd apps/api/src/modules
mkdir mon-module
cd mon-module
mkdir entities dto
touch mon-module.service.ts mon-module.controller.ts mon-module.module.ts
```

### 2. Entity d'abord
```typescript
// entities/mon-entite.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ma_table')
export class MonEntite {
  @PrimaryGeneratedColumn()
  id: number;

  // ... colonnes
}
```

### 3. DTOs avec validation
```typescript
// dto/create-xxx.dto.ts
import { IsString, IsInt, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateXxxDto {
  @ApiProperty({ example: 'Exemple', description: 'Description' })
  @IsString()
  @MinLength(3)
  name: string;
}
```

### 4. Service (logique métier)
```typescript
// mon-module.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MonModuleService {
  constructor(
    @InjectRepository(MonEntite)
    private readonly repo: Repository<MonEntite>,
  ) {}

  async create(dto: CreateXxxDto): Promise<MonEntite> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  // ... autres méthodes
}
```

### 5. Controller (endpoints)
```typescript
// mon-module.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('mon-endpoint')
@ApiTags('mon-module')
export class MonModuleController {
  constructor(private readonly service: MonModuleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create xxx' })
  async create(@Body() dto: CreateXxxDto) {
    return this.service.create(dto);
  }
}
```

### 6. Module NestJS
```typescript
// mon-module.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MonEntite])],
  controllers: [MonModuleController],
  providers: [MonModuleService],
  exports: [MonModuleService], // Si utilisé ailleurs
})
export class MonModuleModule {}
```

### 7. Enregistrer dans app.module.ts
```typescript
import { MonModuleModule } from './modules/mon-module/mon-module.module';

@Module({
  imports: [
    // ... autres modules
    MonModuleModule,
  ],
})
```

---

## ✅ Checklist avant commit

Avant chaque commit, vérifier :

- [ ] Code compile sans erreur (`npm run build`)
- [ ] Linter OK (`npm run lint`)
- [ ] Tous les DTOs ont validation class-validator
- [ ] Tous les endpoints admin ont `@UseGuards + @Roles`
- [ ] Swagger tags et operations documentés
- [ ] Pas de console.log() oublié
- [ ] Types importés depuis @art-shop/shared si applicable
- [ ] Nommage cohérent (kebab-case pour fichiers, PascalCase pour classes)

---

## 🎯 Objectif final

**Backend API REST complet** avec :
- ✅ 10 modules fonctionnels
- ✅ 80+ endpoints sécurisés
- ✅ 15 tables PostgreSQL avec relations
- ✅ JWT + refresh token + rate limiting
- ✅ Validation complète des inputs
- ✅ Documentation Swagger
- ✅ Gestion erreurs globale
- ✅ Tests unitaires (optionnel mais recommandé)

**Timeline totale estimée : 15 jours**
- Phase 0 (Sécurité) : 1 jour
- Phase 1 (Modules P0) : 5 jours
- Phase 2 (Modules P1) : 6 jours
- Phase 3 (Enhancements) : 3 jours

---

**Dernière mise à jour** : 29 octobre 2025
**Auteur** : Matthéo (M2 EFREI)
