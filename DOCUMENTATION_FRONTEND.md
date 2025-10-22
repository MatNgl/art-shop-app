# Documentation complète - Art Shop Application (Frontend)

> Document de référence technique complet pour le frontend de l'application Art Shop.
> **Framework** : Angular 20+ (standalone components)
> **Date** : Octobre 2025

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Structure des dossiers](#2-structure-des-dossiers)
3. [Technologies et librairies](#3-technologies-et-librairies)
4. [Modules et fonctionnalités](#4-modules-et-fonctionnalités)
5. [Gestion de l'état (State Management)](#5-gestion-de-létat-state-management)
6. [Authentification et autorisation](#6-authentification-et-autorisation)
7. [Formulaires et validation](#7-formulaires-et-validation)
8. [Routing et navigation](#8-routing-et-navigation)
9. [Services partagés](#9-services-partagés)
10. [Components partagés](#10-components-partagés)
11. [Détail des pages principales](#11-détail-des-pages-principales)
12. [Promotions et fidélité](#12-promotions-et-fidélité)
13. [Abonnements](#13-abonnements)
14. [Système de notifications et messaging](#14-système-de-notifications-et-messaging)
15. [Pages légales et aide](#15-pages-légales-et-aide)
16. [Performance et optimisation](#16-performance-et-optimisation)
17. [Accessibilité (A11y)](#17-accessibilité-a11y)

---

## 1. Vue d'ensemble de l'architecture

### Principes architecturaux

L'application suit une **architecture orientée fonctionnalités** (feature-based architecture) inspirée du Domain-Driven Design (DDD) :

- **Standalone Components** : Tous les composants Angular sont standalone (pas de NgModule)
- **Lazy Loading** : Chaque feature module est chargé à la demande
- **Signals** : Utilisation intensive des Signals Angular pour la réactivité
- **Stores locaux** : Pattern de stores avec Signals pour la gestion d'état
- **localStorage** : Persistance côté client pour simulation backend

### Pattern de conception

```
src/app/
├── core/           # Guards, interceptors, configuration globale
├── shared/         # Composants, services, pipes réutilisables
├── features/       # Modules métier (catalog, cart, admin, etc.)
└── app.routes.ts   # Configuration du routing principal
```

Chaque **feature** contient :

- `pages/` : Composants de pages (routes)
- `components/` : Composants internes à la feature
- `services/` : Services métier et stores
- `models/` : Interfaces TypeScript
- `guards/` : Guards spécifiques (optionnel)
- `routes.ts` : Configuration du routing de la feature

---

## 2. Structure des dossiers

```
src/app/
├── core/
│   └── guards/
│       ├── auth.guard.ts              # Protection routes authentifiées
│       ├── admin.guard.ts             # Protection routes admin
│       ├── cart-not-empty.guard.ts    # Vérifie panier non vide
│       └── product-available.guard.ts # Vérifie disponibilité produit
│
├── shared/
│   ├── components/
│   │   ├── footer/                    # Footer avec newsletter
│   │   ├── header/                    # Header avec panier, auth
│   │   └── product-card/              # Carte produit réutilisable
│   ├── services/
│   │   ├── toast.service.ts           # Notifications toast
│   │   ├── confirm.service.ts         # Modales de confirmation
│   │   ├── discount.service.ts        # Coupons de réduction
│   │   ├── email.service.ts           # Emails simulés
│   │   ├── browsing-history.service.ts
│   │   └── recommendations.service.ts
│   ├── pipes/
│   │   └── price.pipe.ts              # Formatage prix (ex: "12,99 €")
│   └── directives/
│       └── fr-phone-mask.directive.ts # Masque téléphone français
│
├── features/
│   ├── auth/                          # Authentification
│   │   ├── pages/
│   │   │   ├── login.page.ts
│   │   │   └── register.page.ts
│   │   ├── services/
│   │   │   ├── auth.ts                # Service d'authentification
│   │   │   └── oauth.service.ts       # OAuth Google/Facebook
│   │   └── auth.routes.ts
│   │
│   ├── catalog/                       # Catalogue produits
│   │   ├── pages/
│   │   │   ├── catalog/catalog.component.ts    # Grille produits + filtres
│   │   │   └── product-detail/product-detail.component.ts
│   │   ├── services/
│   │   │   ├── product.ts             # CRUD produits
│   │   │   ├── category.ts            # Catégories
│   │   │   └── format.service.ts      # Formats d'impression
│   │   └── catalog.routes.ts
│   │
│   ├── cart/                          # Panier et commande
│   │   ├── pages/
│   │   │   ├── cart/cart.component.ts           # Page panier
│   │   │   ├── checkout/checkout.component.ts   # Page paiement
│   │   │   └── confirmation/confirmation.component.ts
│   │   ├── services/
│   │   │   ├── cart-store.ts          # Store panier (Signal)
│   │   │   └── order-store.ts         # Gestion commandes
│   │   └── (routes inline dans app.routes.ts)
│   │
│   ├── admin/                         # Dashboard admin
│   │   ├── pages/
│   │   │   ├── create-product.page.ts
│   │   │   ├── edit-product.page.ts
│   │   │   ├── order-details.page.ts
│   │   │   └── user-details.page.ts
│   │   ├── dashboard/
│   │   │   ├── stores/
│   │   │   │   ├── admin-store.ts     # Stats admin
│   │   │   │   ├── sales-store.ts
│   │   │   │   └── users-store.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── services/
│   │   │   └── user-activity.ts
│   │   └── admin.routes.ts
│   │
│   ├── profile/                       # Profil utilisateur
│   │   ├── services/
│   │   │   ├── addresses-store.ts     # Adresses sauvegardées
│   │   │   └── payments-store.ts      # Moyens de paiement
│   │   └── profile.routes.ts
│   │
│   ├── favorites/                     # Favoris
│   │   ├── pages/
│   │   │   └── favorites-page.component.ts
│   │   ├── services/
│   │   │   └── favorites-store.ts     # Store favoris
│   │   └── favorites.routes.ts
│   │
│   ├── promotions/                    # Promotions automatiques
│   │   ├── services/
│   │   │   ├── promotion.service.ts
│   │   │   ├── product-promotion.service.ts
│   │   │   ├── cart-promotion-engine.service.ts
│   │   │   └── promotions-store.ts
│   │   └── promotions.routes.ts
│   │
│   ├── fidelity/                      # Fidélité
│   │   ├── services/
│   │   │   ├── fidelity-store.ts
│   │   │   └── fidelity-calculator.service.ts
│   │   └── guards/
│   │       └── fidelity.guard.ts
│   │
│   ├── subscriptions/                 # Abonnements mensuels
│   │   ├── services/
│   │   │   ├── subscription.service.ts
│   │   │   ├── subscription-store.ts
│   │   │   ├── subscription-billing.service.ts
│   │   │   └── monthly-box.service.ts
│   │   └── subscriptions.routes.ts
│   │
│   ├── notifications/                 # Système de notifications
│   │   ├── pages/
│   │   │   ├── notifications-page.component.ts
│   │   │   └── alert-settings.page.ts
│   │   ├── services/
│   │   │   └── admin-notification.service.ts
│   │   └── notifications.routes.ts
│   │
│   ├── messaging/                     # Messagerie admin
│   │   ├── pages/
│   │   │   └── messaging.page.ts
│   │   ├── components/
│   │   │   ├── admin-conversation-list.component.ts
│   │   │   ├── admin-message-thread.component.ts
│   │   │   └── new-conversation-modal.component.ts
│   │   ├── services/
│   │   │   └── admin-messaging.service.ts
│   │   └── messaging.routes.ts
│   │
│   ├── legal/                         # Pages légales
│   │   ├── pages/
│   │   │   ├── terms.page.ts          # CGV
│   │   │   ├── privacy.page.ts        # RGPD
│   │   │   ├── cookies.page.ts
│   │   │   ├── faq.page.ts
│   │   │   └── shipping.page.ts
│   │   └── legal.routes.ts
│   │
│   ├── contact/                       # Contact
│   │   └── pages/
│   │       └── contact.page.ts
│   │
│   └── help/                          # Centre d'aide
│       └── pages/
│           └── help.page.ts
│
└── app.routes.ts                      # Routing racine
```

---

## 3. Technologies et librairies

### Core

- **Angular 20+** : Framework principal
- **TypeScript 5+** : Langage
- **Tailwind CSS 3.x** : Styling
- **RxJS** : Programmation réactive (minimal, remplacé par Signals)
- **Signals** : Gestion d'état réactive native Angular

### Librairies tierces

- **@ng-select/ng-select** : Sélecteurs avancés (pays, catégories)
- **i18n-iso-countries** : Liste des pays avec drapeaux
- **Font Awesome** : Icônes
- **ng-zorro-antd** (partiel) : Composants UI avancés

### Outils de développement

- **ESLint** : Linting TypeScript
- **Prettier** : Formatage du code
- **Angular CLI** : Build, dev server, tests

---

## 4. Modules et fonctionnalités

### 4.1 Catalogue (`features/catalog`)

**Pages** :

- `catalog.component.ts` : Grille de produits avec filtres avancés
- `product-detail.component.ts` : Détail produit avec sélection de formats
- `home.component.ts` : Page d'accueil (non listé dans les routes ci-dessus)

**Fonctionnalités** :

- ✅ Recherche par mot-clé (debounced 300ms)
- ✅ Filtres : catégories, sous-catégories, prix min/max, promotions
- ✅ Tri : plus récent, plus ancien, prix croissant/décroissant, titre A-Z
- ✅ Pagination (15 produits/page, contrôles « ‹ », « › », « « », « » »)
- ✅ Breadcrumb contextuel
- ✅ Bannière dynamique par catégorie (avec fallback)
- ✅ Product card réutilisable avec favori, badge promo

**Services** :

- `ProductService` : CRUD produits (localStorage)
- `CategoryService` : Gestion catégories et sous-catégories
- `FormatService` : Formats d'impression (A4, A3, encadré, etc.)

**Modèles** :

```typescript
interface Product {
  id: number;
  title: string;
  artistName: string;
  imageUrl: string;
  originalPrice: number;
  reducedPrice?: number;
  stock: number;
  categoryId: number;
  categorySlug?: string;
  createdAt: Date;
  formats?: ProductFormat[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  bannerUrl?: string;
  subCategories?: SubCategory[];
}
```

---

### 4.2 Panier et commande (`features/cart`)

**Pages** :

1. **Cart** (`cart.component.ts`)
   - Liste des articles avec image, titre, prix, quantité
   - Boutons +/- pour ajuster la quantité (max = stock)
   - Suppression d'article
   - Affichage des promotions actives (par article et globales)
   - Preview fidélité (points gagnés, récompenses applicables)
   - Upsell banner abonnement (si non abonné)
   - Récap : sous-total, promos, total
   - Bouton "Passer commande" → `/checkout`

2. **Checkout** (`checkout.component.ts`)
   - **Formulaire multi-sections** :
     - Contact : email (pré-rempli si connecté), newsletter opt-in
     - Livraison : adresses sauvegardées OU nouvelle adresse (prénom, nom, entreprise, rue, code postal, ville, pays, téléphone)
     - Mode d'expédition : Standard (gratuit) / Express (6,90 €)
     - Paiement : cartes sauvegardées OU nouvelle carte (type, numéro, expiration, CVC, nom sur la carte)
   - **Validation** :
     - Code postal français 5 chiffres
     - Téléphone français (optionnel, masque `06 11 22 33 44`)
     - Numéro de carte 16 chiffres (formaté `1234 5678 9012 3456`)
     - CVC 3 chiffres
   - **Coupons** : Champ pour code promo / carte-cadeau
   - **Fidélité** : Sélecteur de récompense (réduction €, %, livraison gratuite, cadeau)
   - **Récap sticky** : Liste produits, sous-total, promotions, fidélité, expédition, total final
   - **Validation commande** : Crée la commande, envoie email de confirmation, redirige vers `/cart/confirmation/:id`

3. **Confirmation** (`confirmation.component.ts`)
   - Affiche le numéro de commande
   - Résumé : articles, adresse, paiement, total
   - Message de confirmation + email envoyé
   - Bouton "Continuer mes achats"

**Services** :

- `CartStore` : Store Signal pour le panier
  - Méthodes : `add()`, `remove()`, `inc()`, `dec()`, `clear()`
  - Signals : `items()`, `count()`, `subtotal()`, `empty()`
  - Support abonnement dans le panier (`subscriptionItem()`)
- `OrderStore` : Gestion des commandes
  - `placeOrder()` : Crée une commande (statut 'pending')
  - `updateStatus()` : Met à jour le statut ('processing', 'shipped', 'delivered', 'cancelled')
  - `getById()`, `getByUserId()`

**Formulaires** :

- **ReactiveFormsModule** avec FormBuilder
- **Validators** : `Validators.required`, `Validators.email`, `Validators.pattern()`, `Validators.minLength()`
- **Validators custom** :
  - `frPhoneValidator` : Validation téléphone français (10 chiffres, commence par 0)
  - `noDigitsValidator` : Interdit les chiffres (pour prénom, nom, ville)
  - `cardNumberValidator` : 16 chiffres
  - `cardExpiryValidator` : Format `YYYY-MM` ou `MM/YY`
  - `cardCvcValidator` : 3 chiffres
- **Directives custom** :
  - `FrPhoneMaskDirective` : Formate automatiquement le téléphone (`06 11 22 33 44`)

**Intégrations** :

- Promotions : Calcul automatique des promos cart-wide via `CartPromotionEngine`
- Fidélité : Application de récompenses en temps réel
- Abonnements : Multipli de points de fidélité si abonné actif

---

### 4.3 Authentification (`features/auth`)

**Pages** :

- `login.page.ts` : Connexion email/mot de passe + OAuth (Google, Facebook)
- `register.page.ts` : Inscription (email, mot de passe, confirmation)

**Service** : `AuthService`

- `login(email, password)` : Authentifie et stocke le token + user dans localStorage
- `register(email, password, firstName, lastName)` : Crée un compte
- `logout()` : Supprime le token et redirige vers login
- `getCurrentUser()` : Retourne l'utilisateur courant (ou null)
- `isAuthenticated()` : Vérifie si token valide
- `currentUser$()` : Signal de l'utilisateur courant

**OAuth** : `OAuthService`

- `loginWithGoogle()`, `loginWithFacebook()`
- Génère un token fictif pour simulation

**Guards** :

- `authGuard` : Redirige vers `/auth/login` si non authentifié
- `adminGuard` : Vérifie `user.role === 'admin'`

**Modèle** :

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  phone?: string;
  addresses?: Address[];
  createdAt: Date;
}
```

---

### 4.4 Admin (`features/admin`)

**Dashboard** (`admin/dashboard/`)

- `dashboard-home.page.ts` : Vue d'ensemble (CA, commandes, utilisateurs, stocks)
- **Stores** :
  - `AdminStore` : Stats globales
  - `SalesStore` : Ventes par période
  - `UsersStore` : Liste utilisateurs
  - `StocksStore` : Alertes stock bas

**Pages de gestion** :

- `create-product.page.ts` / `edit-product.page.ts` : CRUD produits
- `create-category.page.ts` / `edit-category.page.ts` : CRUD catégories
- `create-format.page.ts` / `edit-format.page.ts` : CRUD formats
- `order-details.page.ts` : Détail commande (changer statut, voir client)
- `user-details.page.ts` : Détail utilisateur (historique, fidélité, abonnement)

**Promotions admin** :

- `promotions-list.component.ts` : Liste promotions
- `promotion-form.component.ts` : Créer/éditer promo (scope, type, dates, conditions)

**Abonnements admin** :

- `subscription-form.page.ts` : Créer/éditer plan d'abonnement
- `subscription-billing.page.ts` : Historique de facturation
- `subscription-boxes.page.ts` : Gestion des box mensuelles
- `plan-change-history.page.ts` : Historique changements de plan

**Settings** :

- `settings.routes.ts` : Configuration site (logo, SEO, emails, etc.)

**Guards** :

- Routes admin protégées par `[authGuard, adminGuard]`

---

### 4.5 Profil (`features/profile`)

**Pages** :

- `profile.page.ts` : Infos personnelles (nom, email, téléphone)
- `addresses.page.ts` : Gestion adresses (ajouter, modifier, supprimer, définir par défaut)
- `payments.page.ts` : Gestion cartes (ajouter, modifier, supprimer, définir par défaut)
- `orders.page.ts` : Historique commandes

**Stores** :

- `AddressesStore` : Signal store pour adresses
- `PaymentsStore` : Signal store pour moyens de paiement

**Modèles** :

```typescript
interface Address {
  id?: string;
  label?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  label?: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';
  last4: string;
  expMonth: number;
  expYear: number;
  holder?: string;
  isDefault: boolean;
}
```

---

### 4.6 Favoris (`features/favorites`)

**Page** : `favorites-page.component.ts`

- Grille produits favoris (identique à catalog)
- Bouton "Retirer des favoris"

**Service** : `FavoritesStore`

- `toggle(productId)` : Ajoute/retire des favoris
- `has(productId)` : Vérifie si produit est favori
- `items()` : Signal retournant Set<number> des IDs favoris
- Persistance dans localStorage

---

## 5. Gestion de l'état (State Management)

### Pattern de Signal Store

L'application utilise un pattern de **Signal Store** pour la gestion d'état :

```typescript
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);
  private readonly _subscriptionItem = signal<SubscriptionCartItem | null>(null);

  readonly items = this._items.asReadonly();
  readonly subscriptionItem = this._subscriptionItem.asReadonly();

  readonly count = computed(() => this._items().reduce((sum, it) => sum + it.qty, 0));
  readonly subtotal = computed(() => {
    const productsTotal = this._items().reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
    const subTotal = this._subscriptionItem()?.snapshot.priceCharged ?? 0;
    return productsTotal + subTotal;
  });
  readonly empty = computed(() => this.count() === 0 && !this._subscriptionItem());

  add(item: CartItem): void {
    const existing = this._items().find(
      it => it.productId === item.productId && it.variantId === item.variantId
    );
    if (existing) {
      this.inc(item.productId, item.variantId);
    } else {
      this._items.update(items => [...items, { ...item, qty: 1 }]);
    }
  }

  // ... autres méthodes
}
```

**Avantages** :

- ✅ Réactivité automatique (computed, effect)
- ✅ Pas de subscription RxJS à gérer
- ✅ Immutabilité forcée (`.asReadonly()`)
- ✅ Performance (change detection optimisée)

### Stores principaux

| Store               | Responsabilité                    |
| ------------------- | --------------------------------- |
| `CartStore`         | Panier produits + abonnement      |
| `FavoritesStore`    | Liste produits favoris            |
| `AddressesStore`    | Adresses utilisateur              |
| `PaymentsStore`     | Cartes de paiement                |
| `FidelityStore`     | Points fidélité + récompenses     |
| `SubscriptionStore` | Abonnement actif de l'utilisateur |
| `PromotionsStore`   | Promotions actives                |
| `AdminStore`        | Stats admin                       |
| `SalesStore`        | Ventes admin                      |
| `UsersStore`        | Utilisateurs admin                |

---

## 6. Authentification et autorisation

### Flow d'authentification

1. **Inscription** : `AuthService.register()`
   - Création user dans localStorage
   - Génération token JWT simulé
   - Redirection vers `/`

2. **Connexion** :
   - Email/password : `AuthService.login()`
   - OAuth : `OAuthService.loginWithGoogle/Facebook()`
   - Stockage token + user dans localStorage
   - Redirection vers page d'origine (ou `/`)

3. **Déconnexion** :
   - `AuthService.logout()`
   - Suppression token + user
   - Redirection vers `/auth/login`

### Guards

**authGuard** (`core/guards/auth.guard.ts`)

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  return true;
};
```

**adminGuard** (`core/guards/admin.guard.ts`)

```typescript
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser$();
  if (user?.role !== 'admin') {
    router.navigate(['/']);
    return false;
  }
  return true;
};
```

**cartNotEmptyGuard** (`core/guards/cart-not-empty.guard.ts`)

- Empêche l'accès à `/checkout` si panier vide

**productAvailableGuard** (`core/guards/product-available.guard.ts`)

- Vérifie que le produit existe avant d'afficher la page détail

---

## 7. Formulaires et validation

### Stratégie de validation

Tous les formulaires utilisent **ReactiveFormsModule** avec :

- `FormBuilder` pour construction
- `Validators` built-in (required, email, minLength, pattern)
- **Validators custom** pour règles métier

### Exemples de validators custom

**Téléphone français** :

```typescript
function frPhoneValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = ctrl.value;
  if (!value || !String(value).trim()) return null;
  const digits = String(value).replace(/\D/g, '');
  const normalized =
    digits.startsWith('33') && digits.length >= 11 ? '0' + digits.slice(2) : digits;
  return normalized.length === 10 && normalized.startsWith('0') ? null : { phoneFr: true };
}
```

**Pas de chiffres** (prénom, nom, ville) :

```typescript
function noDigitsValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = (ctrl.value ?? '').toString();
  if (!value.trim()) return null;
  return /\d/.test(value) ? { noDigits: true } : null;
}
```

**Numéro de carte** :

```typescript
function cardNumberValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = ctrl.value;
  if (!value || !String(value).trim()) return { required: true };
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 16 ? null : { cardNumber: true };
}
```

### Formatage en temps réel

**Directive de masque téléphone** (`FrPhoneMaskDirective`) :

- Formate automatiquement : `0611223344` → `06 11 22 33 44`
- Gère curseur et backspace intelligemment

**Formatage carte bancaire** :

- `formatCardNumber()` : Ajoute espaces tous les 4 chiffres
- `handleCardBackspace()` : Gère backspace sur espaces

### Affichage des erreurs

**Pattern utilisé** :

```html
<input
  id="firstName"
  class="input"
  [class.invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched"
  formControlName="firstName"
/>
<p class="err" *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched">
  Le prénom est requis (minimum 2 caractères).
</p>
```

- Erreur affichée uniquement si champ `touched` ET `invalid`
- Classe CSS `.invalid` pour styling visuel (bordure rouge)

---

## 8. Routing et navigation

### Configuration principale (`app.routes.ts`)

```typescript
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'product/:id',
    canActivate: [productAvailableGuard],
    loadComponent: () =>
      import('./features/catalog/pages/product-detail/product-detail.component').then(
        c => c.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/pages/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard, cartNotEmptyGuard],
    loadComponent: () =>
      import('./features/cart/pages/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'cart/confirmation/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/pages/confirmation/confirmation.component').then(
        m => m.ConfirmationComponent
      ),
  },
  ...PROFILE_ROUTES,
  {
    path: 'favorites',
    loadChildren: () =>
      import('./features/favorites/favorites.routes').then(m => m.FAVORITES_ROUTES),
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('./features/promotions/pages/promotions-public.component').then(
        m => m.PromotionsListComponent
      ),
  },
  {
    path: 'fidelity',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/fidelity/pages/user-fidelity/user-fidelity.page').then(
        m => m.UserFidelityPage
      ),
  },
  {
    path: 'subscriptions',
    loadChildren: () => import('./features/subscriptions/subscriptions.routes'),
  },
  {
    path: 'legal',
    loadChildren: () => import('./features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/pages/contact.page').then(m => m.ContactPage),
  },
  {
    path: 'help',
    loadComponent: () => import('./features/help/pages/help.page').then(m => m.HelpPage),
  },
  {
    path: '404',
    loadComponent: () => import('./shared/pages/not-found.page').then(m => m.NotFoundPage),
  },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];
```

### Lazy Loading

Toutes les features sont lazy-loaded :

- ✅ Réduit le bundle initial
- ✅ Charge les modules à la demande
- ✅ Améliore les performances (First Contentful Paint)

**Exemple** :

```typescript
{
  path: 'legal',
  loadChildren: () => import('./features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
}
```

### Query params

**Catalogue** : Filtres et tri persistés dans l'URL

```
/catalog?categorySlug=peinture&promo=true&sort=price-asc&page=2
```

**Avantages** :

- ✅ URL partageable
- ✅ Navigation back/forward fonctionnelle
- ✅ SEO-friendly

**Implémentation** :

```typescript
this.router.navigate([], {
  relativeTo: this.route,
  queryParams: { categorySlug: slug, page: 1 },
  queryParamsHandling: 'merge',
});
```

---

## 9. Services partagés

### ToastService (`shared/services/toast.service.ts`)

**Rôle** : Affiche des notifications toast (succès, erreur, info, warning)

**Méthodes** :

```typescript
toast.success('Produit ajouté au panier');
toast.error('Email ou mot de passe incorrect');
toast.info('Nouveau message reçu');
toast.warning('Stock faible pour ce produit');
toast.requireAuth('favorites'); // Message spécial pour demander connexion
```

**Implémentation** : Signal store avec auto-dismiss après 4 secondes

---

### ConfirmService (`shared/services/confirm.service.ts`)

**Rôle** : Modales de confirmation asynchrones

**Usage** :

```typescript
const confirmed = await this.confirm.ask({
  title: 'Supprimer ce produit ?',
  message: 'Cette action est irréversible.',
  variant: 'danger',
  confirmText: 'Supprimer',
  cancelText: 'Annuler',
});

if (confirmed) {
  // Supprimer
}
```

**Retour** : `Promise<boolean>`

---

### DiscountService (`shared/services/discount.service.ts`)

**Rôle** : Gestion des coupons de réduction et cartes-cadeaux

**Méthodes** :

```typescript
find(code: string): Promise<DiscountRule | null>
computeAmount(rule: DiscountRule): { amount: number; reason?: string }
calculateCartPromotions(): Promise<{ totalDiscount: number }>
```

**Types de réductions** :

- `percentage` : X% de réduction
- `fixed_amount` : X€ de réduction
- `shipping_free` : Livraison gratuite

**Conditions** :

- `minAmount` : Montant minimum panier
- `maxUses` : Nombre d'utilisations max
- `validFrom` / `validUntil` : Période de validité
- `onlyFirstOrder` : Réservé aux nouveaux clients

---

### EmailService (`shared/services/email.service.ts`)

**Rôle** : Simulation d'envoi d'emails (console + localStorage)

**Emails envoyés** :

- Confirmation de commande (`sendOrderConfirmationEmail()`)
- Réinitialisation mot de passe
- Newsletter

**Implémentation** : Simule un délai de 500ms et log en console

---

### BrowsingHistoryService + RecommendationsService

**BrowsingHistoryService** :

- Enregistre les produits consultés
- Stocke dans localStorage (`browsing_history`)

**RecommendationsService** :

- Génère des recommandations basées sur :
  - Historique de navigation
  - Produits similaires (même catégorie)
  - Tendances (produits populaires)

---

## 10. Components partagés

### HeaderComponent (`shared/components/header/`)

**Fonctionnalités** :

- Logo + navigation principale
- Barre de recherche (debounced)
- Icône panier avec badge de quantité
- Icône favoris avec badge
- Menu utilisateur (connecté) OU boutons Login/Register
- Icône notifications (admins uniquement) avec badge unread
- Icône messages (admins uniquement) avec badge unread

**Navigation** :

- Home, Catalogue, Promotions, Abonnements, Aide
- Si admin : Dashboard, Notifications, Messages

**Responsive** :

- Menu hamburger sur mobile
- Sidebar overlay

---

### FooterComponent (`shared/components/footer/`)

**Sections** :

1. **Newsletter** :
   - Formulaire email + consentement RGPD
   - Validation email (regex)
   - Honeypot anti-bot (champ caché)
   - Stockage dans localStorage (`newsletter_subscriptions`)

2. **Liens catalogue** :
   - Tous les articles
   - Promotions
   - Liste des catégories actives (chargement dynamique)

3. **Liens compte** :
   - Profil, Mes commandes, Mes favoris, Mon panier

4. **Liens aide** :
   - Centre d'aide, Contact, FAQ, Livraison & retours, Confidentialité

5. **Bas de page** :
   - Copyright + année dynamique
   - CGV, Politique de confidentialité, Cookies

**Formulaire newsletter** :

```typescript
form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.pattern(EMAIL_RX)]],
  consent: [false, [Validators.requiredTrue]],
  honeypot: [''], // Anti-bot
});
```

---

### ProductCardComponent (`shared/components/product-card/`)

**Props** :

- `@Input() product: Product`
- `@Input() isFavorite: boolean`
- `@Output() toggleFavorite = new EventEmitter<number>()`
- `@Output() view = new EventEmitter<number>()`

**Affichage** :

- Image produit
- Titre + artiste
- Prix (barré si réduction)
- Badge promo (% ou €)
- Icône favori (cœur)
- Bouton "Voir le produit"

**Responsive** :

- Grid auto-fill (min 340px)
- Hover effects (zoom image, shadow)

---

## 11. Détail des pages principales

### 11.1 Page Catalogue (`catalog.component.ts`)

**URL** : `/catalog?categorySlug=...&promo=true&search=...&sort=...&page=1`

**Layout** :

```
┌─────────────────────────────────────┐
│  Bannière catégorie (H:200-240px)   │
├─────────────────────────────────────┤
│  Breadcrumb : Accueil › Catalogue   │
│  Titre : Catalogue (ou cat. name)   │
│  X œuvres | Tri : [Dropdown]        │
├─────────────────────────────────────┤
│  [▼ Filtres avancés] (collapsible)  │
│    - Recherche                      │
│    - Prix min/max                   │
│    [Réinitialiser]                  │
├─────────────────────────────────────┤
│  Grille produits (auto-fill)        │
│  [Card] [Card] [Card] [Card]        │
│  [Card] [Card] [Card] [Card]        │
│  ...                                │
├─────────────────────────────────────┤
│  « ‹ [1] 2 3 4 5 › »                │
└─────────────────────────────────────┘
```

**Filtres** :

- **Recherche** : Mot-clé dans titre, technique, artiste (debounce 300ms)
- **Catégories** : Via query param `categorySlug` (passé depuis header ou footer)
- **Sous-catégories** : Via `subCategorySlug`
- **Prix** : `minPrice` et `maxPrice`
- **Promotions uniquement** : `promo=true`

**Tri** :

- Plus récent (défaut)
- Plus ancien
- Prix croissant
- Prix décroissant
- Titre A-Z

**Pagination** :

- 15 produits/page
- Contrôles : « (première), ‹ (précédente), [numéros], › (suivante), » (dernière)
- Page courante en bleu

**Bannière** :

- Si catégorie sélectionnée : bannière catégorie (ou fallback)
- Sinon : bannière générique
- Gestion erreur image : fallback automatique

**Loading states** :

- Skeleton loaders (8 cartes)
- Affichage "Aucune œuvre trouvée" si aucun résultat

---

### 11.2 Page Détail Produit (`product-detail.component.ts`)

**URL** : `/product/:id`

**Guard** : `productAvailableGuard` (404 si produit inexistant)

**Layout** :

```
┌────────────────────┬────────────────────┐
│                    │  Titre              │
│                    │  Artiste            │
│  Image produit     │  Prix (barré si ↓)  │
│  (ratio 4:3)       │  Badge promo        │
│                    │                     │
│  [Miniatures]      │  [Sélection format] │
│                    │  - A4 (29,7×21 cm)  │
│                    │  - A3 (42×29,7 cm)  │
│                    │  - Encadré A4 (+15€)│
│                    │                     │
│                    │  Quantité : [-] 1 [+]│
│                    │  Stock : X restants │
│                    │                     │
│                    │  [Ajouter au panier]│
│                    │  [♡ Favoris]        │
├────────────────────┴────────────────────┤
│  Description détaillée                  │
│  Techniques utilisées                   │
│  Dimensions                             │
└─────────────────────────────────────────┘
```

**Fonctionnalités** :

- Galerie images (si plusieurs images)
- Sélection format obligatoire (si disponible)
- Ajustement quantité (min 1, max stock)
- Ajout au panier
- Ajout/retrait favoris
- Breadcrumb : Accueil › Catalogue › Catégorie › Produit

**Gestion stock** :

- Si stock = 0 : bouton "Rupture de stock" (disabled)
- Si stock < 5 : message "Plus que X en stock"

---

### 11.3 Page Panier (`cart.component.ts`)

**URL** : `/cart`

**Layout** :

```
┌─────────────────────────────┬─────────────┐
│  Liste produits             │  Résumé     │
│  ┌───────────────────────┐  │  (sticky)   │
│  │ [Img] Titre           │  │             │
│  │       Artiste         │  │  Articles   │
│  │       Format          │  │  12,99 €    │
│  │  [-] 2 [+]   24,98 €  │  │             │
│  │  [Supprimer]          │  │  Promos     │
│  └───────────────────────┘  │  -3,00 €    │
│                             │             │
│  ┌───────────────────────┐  │  Fidélité   │
│  │ [Img] Titre           │  │  -2,50 €    │
│  │  ...                  │  │             │
│  └───────────────────────┘  │  Total      │
│                             │  19,49 €    │
│  [Vider le panier]          │             │
│                             │  [Passer    │
│                             │   commande] │
└─────────────────────────────┴─────────────┘
```

**Affichage promotions** :

- Badge promo par article (ex: "-20%", "2ème offert")
- Prix barré + prix réduit
- Section "Promotions actives" dans le récap

**Affichage fidélité** :

- Preview points gagnés sur cette commande
- Récompenses applicables (si points suffisants)
- Bouton "Annuler la récompense" si appliquée

**Upsell abonnement** :

- Banner affiché si non abonné et panier > seuil
- "Devenez membre premium pour X€/mois"

**Abonnement dans le panier** :

- Si abonnement ajouté : affichage distinct (icône couronne)
- Prix mensuel/annuel

---

### 11.4 Page Checkout (`checkout.component.ts`)

**URL** : `/checkout`

**Guards** : `authGuard`, `cartNotEmptyGuard`

**Layout** : 2 colonnes (formulaire gauche, récap droite sticky)

**Formulaire sections** :

1. **Contact** :
   - Email (readonly si connecté)
   - Checkbox newsletter

2. **Livraison** :
   - Liste adresses sauvegardées (radio buttons)
   - OU "Utiliser une nouvelle adresse"
   - Formulaire nouvelle adresse :
     - Pays (ng-select avec drapeaux)
     - Prénom, Nom
     - Entreprise (optionnel)
     - Adresse (rue, complément)
     - Code postal (5 chiffres FR)
     - Ville
     - Téléphone (optionnel, masque FR)
   - Checkbox "Sauvegarder cette adresse"

3. **Mode d'expédition** :
   - Standard (gratuit, 3-5j)
   - Express (6,90€, 24-48h)
   - Affiché uniquement si adresse complète

4. **Paiement** :
   - Liste cartes sauvegardées (radio buttons)
   - OU "Utiliser une nouvelle carte"
   - Formulaire nouvelle carte :
     - Type (Visa, Mastercard, Amex, PayPal)
     - Nom (alias optionnel)
     - Numéro (16 chiffres, formaté)
     - Expiration (input type="month")
     - CVC (3 chiffres)
     - Nom sur la carte
   - Checkbox "Sauvegarder cette carte"
   - Checkbox "Adresse de facturation = livraison"

**Récap sticky** :

- Champ code promo
- Liste produits avec miniatures
- Sous-total
- Promotions automatiques (détail)
- Code promo (si appliqué)
- Sélecteur fidélité (récompenses disponibles)
- Expédition
- **Total final**
- Points fidélité gagnés (si abonné : multiplicateur affiché)

**Bouton validation** :

- "Valider la commande • XX,XX €"
- Disabled si formulaire invalide OU panier vide

**Flux validation** :

1. Validation formulaire (tous les champs requis)
2. Sauvegarde adresse/paiement si demandé
3. Création commande (statut 'pending')
4. Mise à jour statut → 'processing'
5. Finalisation fidélité (points déduits si récompense)
6. Envoi email confirmation
7. Redirection `/cart/confirmation/:orderId`

---

### 11.5 Page Confirmation (`confirmation.component.ts`)

**URL** : `/cart/confirmation/:id`

**Layout** :

```
┌──────────────────────────────────────┐
│  ✅ Commande confirmée !              │
│  Numéro de commande : #12345         │
│  Un email a été envoyé à votre@email │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Résumé de la commande               │
│  ┌────────────────────────────────┐  │
│  │ [Img] Produit × 2              │  │
│  │       24,98 €                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  Livraison                           │
│  Jean Dupont                         │
│  123 Rue de la Paix                  │
│  75001 Paris, France                 │
│                                      │
│  Paiement                            │
│  VISA •••• 1234                      │
│                                      │
│  Total payé : 24,98 €                │
└──────────────────────────────────────┘

[Continuer mes achats]  [Voir mes commandes]
```

**Actions** :

- "Continuer mes achats" → `/catalog`
- "Voir mes commandes" → `/profile/orders`

---

## 12. Promotions et fidélité

### 12.1 Système de promotions (`features/promotions`)

**Types de promotions** :

1. **Product scope** : Réduction sur produit(s) spécifique(s)
   - `productIds: [1, 5, 12]`
   - Réduction : % ou €

2. **Category scope** : Réduction sur catégorie(s)
   - `categorySlugs: ['peinture', 'sculpture']`
   - Réduction : % ou €

3. **Site-wide** : Réduction sur tout le site
   - Réduction : % ou €

4. **Buy X Get Y** : Achetez X, obtenez Y gratuit
   - `buyQuantity: 2`, `getQuantity: 1` (ex: 3ème offert)
   - `applyOn: 'cheapest' | 'most-expensive'`

**Conditions** :

- `minAmount` : Montant minimum panier
- `minQuantity` : Quantité minimum
- `validFrom` / `validUntil` : Période de validité
- `code` : Code promo (optionnel, si pas de code = promotion automatique)
- `usageLimit` : Nombre d'utilisations max
- `isStackable` : Cumulable avec d'autres promos

**Moteur de calcul** : `CartPromotionEngine`

- `calculateCartPromotions(items, subtotal)` : Retourne `CartPromotionResult`
- Applique automatiquement les promotions éligibles
- Gère les conflits (non-stackable)
- Calcule les items offerts (Buy X Get Y)

**Affichage** :

- Component `CartPromotionDisplayComponent` : Liste des promos appliquées
- Component `PromotionProgressIndicatorComponent` : Barres de progression (ex: "Plus que 5€ pour la livraison gratuite")

---

### 12.2 Système de fidélité (`features/fidelity`)

**Concepts** :

1. **Points** :
   - Gagnés : 5% du montant de chaque commande (après promos)
   - Si abonné : multiplicateur (x1.5, x2, x3 selon plan)
   - Stockés dans `FidelityStore` (localStorage)

2. **Paliers** :
   - Bronze : 0-500 pts
   - Argent : 500-1500 pts
   - Or : 1500-3000 pts
   - Platine : 3000+ pts

3. **Récompenses** :
   - **amount** : Réduction fixe (ex: -5€)
   - **percent** : Réduction pourcentage (ex: -10%, cap 20€)
   - **shipping** : Livraison gratuite
   - **gift** : Cadeau (ex: poster offert)

**Service** : `FidelityCalculatorService`

- `applyReward(reward, cartAmount)` : Calcule la réduction effective
- Gère les caps (plafonds)
- Vérifie les seuils (ex: reward shipping uniquement si commande > 30€)

**Store** : `FidelityStore`

- `getUserBalance(userId)` : Points actuels
- `getAppliedReward(userId)` : Récompense en cours d'application
- `applyReward(userId, rewardId)` : Applique une récompense au panier
- `cancelAppliedReward(userId)` : Annule la récompense
- `finalizeAppliedRewardOnOrder(userId, orderId)` : Déduit les points après validation commande

**Flow** :

1. Utilisateur consulte `/fidelity` : voit ses points, palier, récompenses disponibles
2. Dans le panier OU checkout : sélecteur de récompense
3. Application immédiate de la réduction (computed)
4. À la validation commande : points déduits, historique enregistré

**Affichage** :

- Component `CartFidelityPreviewComponent` : Preview dans le panier
- Component `CheckoutFidelitySelectorComponent` : Sélecteur dans checkout
- Page `UserFidelityPage` : Dashboard fidélité complet (points, historique, récompenses)

---

## 13. Abonnements

### 13.1 Plans d'abonnement (`features/subscriptions`)

**Plans disponibles** :

1. **Essential** : 9,99€/mois ou 99€/an
   - Multiplicateur points : x1.5
   - 1 article gratuit par trimestre
   - Livraison gratuite dès 30€

2. **Premium** : 19,99€/mois ou 199€/an
   - Multiplicateur points : x2
   - 1 article gratuit par mois
   - Livraison gratuite illimitée
   - Accès early bird aux nouveautés

3. **Collector** : 39,99€/mois ou 399€/an
   - Multiplicateur points : x3
   - Box mensuelle exclusive (œuvre originale)
   - Livraison gratuite illimitée
   - Accès VIP aux ventes privées
   - Support prioritaire

**Services** :

- `SubscriptionService` : CRUD plans
- `SubscriptionStore` : Abonnement actif de l'utilisateur
- `SubscriptionBillingService` : Gestion facturation (simulation)
- `MonthlyBoxService` : Gestion box mensuelles (Collector)

**Modèles** :

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  benefits: string[];
  pointsMultiplier: number;
  freeItemsPerMonth?: number;
  freeShippingThreshold?: number; // null = illimité
}

interface UserSubscription {
  id: string;
  userId: number;
  planId: string;
  term: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  appliedMultiplier: number;
}
```

**Flow souscription** :

1. Page `/subscriptions` : Comparatif des plans (3 cards)
2. Clic "S'abonner" : Ajoute l'abonnement au panier (`cart.addSubscription()`)
3. Checkout : Formulaire standard + mention abonnement
4. Validation : Création `UserSubscription` (statut 'active')
5. Points fidélité : Multiplicateur appliqué immédiatement

**Gestion** :

- Page `/profile/subscription` : Voir détails, changer de plan, résilier
- Admin : `/admin/subscriptions` : Liste souscriptions, stats, box mensuelles

**Box mensuelles** (Collector) :

- Service `MonthlyBoxService` génère une box chaque mois
- Contient : 1 œuvre originale exclusive + goodies
- Page admin : `/admin/subscriptions/boxes` pour gérer les box

---

## 14. Système de notifications et messaging

### 14.1 Notifications (`features/notifications`)

**Types de notifications** :

```typescript
type NotificationCategory =
  | 'system' // Maintenance, mises à jour
  | 'order' // Commandes (statut, livraison)
  | 'promotion' // Nouvelles promos
  | 'product' // Nouveaux produits
  | 'user' // Actions utilisateurs
  | 'alert'; // Alertes (stock bas, etc.)
```

**Service** : `AdminNotificationService`

- `getAll()` : Liste toutes les notifications
- `getUnreadCount()` : Signal du nombre de non-lues
- `markAsRead(id)` / `markAllAsRead()`
- `create(notification)` : Crée une notification
- `delete(id)`

**Page** : `NotificationsPage` (`/admin/notifications`)

- Liste avec filtres par catégorie
- Bouton "Tout marquer comme lu"
- Clic sur notification : marque comme lue + action (ex: ouvrir commande)

**Page** : `AlertSettingsPage` (`/admin/notifications/alerts`)

- Configuration des seuils d'alerte :
  - Stock bas (< X unités)
  - Commandes en attente (> X jours)
  - Nouveaux utilisateurs (> X/jour)

**Affichage header** :

- Badge rouge avec nombre d'unread
- Dropdown avec 5 dernières notifications
- Lien "Voir toutes les notifications"

---

### 14.2 Messagerie admin (`features/messaging`)

**Concepts** :

- **Conversations 1-to-1** entre admins
- Stockage localStorage (`admin_conversations`, `admin_messages`)

**Service** : `AdminMessagingService`

- `createConversation(participantIds, initialMessage?)` : Nouvelle conversation
- `getConversations()` : Liste conversations (signal)
- `getMessages(conversationId)` : Messages d'une conversation
- `sendMessage(conversationId, content)` : Envoie un message
- `getUnreadCount()` : Signal nombre de conversations non lues
- `markAsRead(conversationId)`

**Modèles** :

```typescript
interface AdminConversation {
  id: string;
  title?: string;
  participants: number[]; // admin IDs
  lastMessage?: AdminMessage;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  createdAt: string;
}

interface AdminMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
}
```

**Page** : `MessagingPage` (`/admin/messages`)

**Layout** :

```
┌──────────────┬────────────────────────┐
│  Conversations│  Thread                │
│  (liste)     │                        │
│              │  [Message 1]           │
│  [+ Nouveau] │  [Message 2]           │
│              │  ...                   │
│  ◉ John Doe  │                        │
│    Dernier..│                        │
│              │  ┌──────────────────┐  │
│  ○ Jane S.   │  │ Votre message... │  │
│    Salut...  │  └──────────────────┘  │
│              │  [Envoyer]             │
└──────────────┴────────────────────────┘
```

**Components** :

1. `AdminConversationListComponent` : Liste gauche
   - Bouton "+ Nouvelle conversation"
   - Liste conversations (triées par lastMessageAt desc)
   - Badge unread
   - Highlight conversation sélectionnée

2. `AdminMessageThreadComponent` : Thread droite
   - Header : Nom participant(s), actions (épingler, archiver)
   - Liste messages (scroll auto en bas)
   - Input + bouton "Envoyer"
   - Support Markdown (optionnel)

3. `NewConversationModalComponent` : Modale création
   - Liste admins (checkboxes)
   - Champ message initial (optionnel)
   - Bouton "Créer"

**Affichage header** :

- Badge rouge avec nombre de conversations unread
- Lien vers `/admin/messages`

---

## 15. Pages légales et aide

### 15.1 CGV (`legal/pages/terms.page.ts`)

**Sections** (14 au total) :

1. Objet
2. Produits et services
3. Prix
4. Commandes
5. Modalités de paiement
6. Livraison
7. Droit de rétractation
8. Garanties
9. Responsabilité
10. Propriété intellectuelle
11. Données personnelles
12. Cookies
13. Modification des CGV
14. Droit applicable et juridiction

**Layout** : Document légal classique (fond blanc, padding, texte justifié)

**Date de dernière mise à jour** : Affichée en haut (JavaScript `new Date()`)

---

### 15.2 Politique de confidentialité (`legal/pages/privacy.page.ts`)

**Conforme RGPD** avec 15 sections :

1. Introduction
2. Identité du responsable du traitement
3. Données collectées (tableau détaillé)
4. Base légale du traitement
5. Finalités du traitement
6. Destinataires des données
7. Durées de conservation (tableau)
8. Transferts hors UE
9. Droits des personnes
10. Exercice des droits (contact DPO)
11. Sécurité des données
12. Cookies
13. Modifications de la politique
14. Contact CNIL
15. Date d'entrée en vigueur

**Tableaux** :

- Tableau données collectées (données, finalité, base légale)
- Tableau durées de conservation (type de données, durée, justification)

---

### 15.3 Cookies (`legal/pages/cookies.page.ts`)

**4 catégories de cookies** :

1. **Strictement nécessaires** : Authentification, panier, langue
2. **Performance** : Google Analytics (anonymisé)
3. **Fonctionnels** : Préférences utilisateur
4. **Marketing** : Publicité ciblée (désactivé par défaut)

**Gestion** : Instructions par navigateur (Chrome, Firefox, Safari, Edge)

---

### 15.4 FAQ (`legal/pages/faq.page.ts`)

**18 questions** réparties en 7 catégories :

- Commandes
- Livraison
- Retours
- Paiement
- Compte
- Produits
- Autre

**Fonctionnalités** :

- Filtre par catégorie (signal `selectedCategory()`)
- Accordéons (signal `openItems()` avec Set<string>)
- Recherche (optionnelle, non implémentée)

**Implémentation** :

```typescript
interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

selectedCategory = signal<string>('Toutes');
openItems = signal<Set<string>>(new Set());

filteredFaqs = computed(() => {
  const cat = this.selectedCategory();
  if (cat === 'Toutes') return this.faqs;
  return this.faqs.filter(f => f.category === cat);
});

toggle(question: string): void {
  const current = new Set(this.openItems());
  if (current.has(question)) {
    current.delete(question);
  } else {
    current.add(question);
  }
  this.openItems.set(current);
}
```

---

### 15.5 Livraison et retours (`legal/pages/shipping.page.ts`)

**Sections** :

1. **Modes de livraison** (tableau avec prix et délais)
2. **Emballage** : Détails protection des œuvres
3. **Suivi de commande** : Lien tracking
4. **Retours** : Procédure en 5 étapes
5. **Produits endommagés** : Marche à suivre
6. **Questions fréquentes** : 3 Q&A

---

### 15.6 Page Contact (`contact/pages/contact.page.ts`)

**Formulaire** :

- Nom (requis)
- Email (requis, validation email)
- Sujet (requis, select avec 7 options) :
  - Commande
  - Livraison
  - Retour
  - Produit défectueux
  - Autre question
  - Partenariat
  - Presse
- Message (requis, min 10 caractères)

**Validation** :

```typescript
form = this.fb.group({
  name: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  subject: ['', [Validators.required]],
  message: ['', [Validators.required, Validators.minLength(10)]],
});
```

**Soumission** :

- Simule délai 1s
- Stocke dans localStorage (`contact_messages`)
- Toast succès : "Message envoyé avec succès ! Nous vous répondrons sous 24h."
- Reset formulaire

**Informations complémentaires** :

- Horaires de disponibilité (lundi-vendredi 9h-18h)
- Lien vers FAQ
- Temps de réponse moyen : 24h

---

### 15.7 Page Aide (`help/pages/help.page.ts`)

**Layout** : Hub central avec 6 cards

```
┌──────────────────────────────────┐
│  Centre d'aide                    │
├──────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌─────┐│
│  │  FAQ   │  │Livraison│  │Contact│
│  └────────┘  └────────┘  └─────┘│
│  ┌────────┐  ┌────────┐  ┌─────┐│
│  │Commandes│  │ Compte │  │Légal│ │
│  └────────┘  └────────┘  └─────┘│
└──────────────────────────────────┘
```

Chaque card est un lien vers la page correspondante.

---

### 15.8 Page 404 (`shared/pages/not-found.page.ts`)

**Layout** :

```
┌──────────────────────────────────┐
│         404                       │
│    (gradient bleu-violet)        │
│                                  │
│  Page non trouvée                │
│  La page que vous recherchez...  │
│                                  │
│  [Retour à l'accueil]            │
│                                  │
│  Suggestions :                   │
│  • Catalogue                     │
│  • Promotions                    │
│  • Contact                       │
└──────────────────────────────────┘
```

**Changement récent** : Retrait de l'icône palette superposée sur "404" (remplacé par texte gradient)

---

## 16. Performance et optimisation

### 16.1 Lazy Loading

Toutes les features sont lazy-loaded :

- ✅ Bundle initial réduit (~400 KB gzipped)
- ✅ Modules chargés uniquement si visités
- ✅ Amélioration First Contentful Paint (FCP)

**Build de production** :

```bash
ng build --configuration production
```

**Résultat** (approximatif) :

```
Initial chunk files:
  main.js                     ~380 KB
  polyfills.js                 ~35 KB
  runtime.js                    ~3 KB
  styles.css                   ~12 KB

Lazy chunks (9 features):
  catalog.js                   ~85 KB
  admin.js                    ~120 KB
  cart.js                      ~95 KB
  auth.js                      ~25 KB
  profile.js                   ~40 KB
  favorites.js                 ~20 KB
  subscriptions.js             ~60 KB
  legal.js                     ~45 KB
  ...
```

---

### 16.2 Change Detection

**OnPush Strategy** :

- Tous les composants principaux utilisent `ChangeDetectionStrategy.OnPush`
- Déclenchement uniquement si :
  - Input change (référence)
  - Event émis
  - Signal modifié

**Avantage** : Réduit les cycles de change detection (performance++).

---

### 16.3 Signals et Computed

**Computed values** :

- Mise en cache automatique
- Recalcul uniquement si dépendances changent

**Exemple** :

```typescript
cart.subtotal = computed(() => cart.items().reduce((sum, it) => sum + it.unitPrice * it.qty, 0));
```

---

### 16.4 Pagination et virtualisation

**Pagination** :

- Catalogue : 15 produits/page (évite surcharge DOM)
- Admin : Tables paginées (50 lignes/page)

**Virtualisation** : Pas encore implémentée (optionnel pour futures listes très longues)

---

## 17. Accessibilité (A11y)

### 17.1 Sémantique HTML

- ✅ Tags sémantiques : `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<article>`, `<section>`
- ✅ Headings hiérarchiques : `<h1>` (unique), `<h2>`, `<h3>`
- ✅ Formulaires : `<label for="...">` + `id` sur inputs
- ✅ Boutons : `<button type="button">` (jamais `<div onclick>`)

---

### 17.2 ARIA

**Landmarks** :

```html
<nav aria-label="Navigation principale">
  <nav aria-label="Breadcrumb">
    <aside aria-label="Résumé de commande"></aside>
  </nav>
</nav>
```

**States** :

```html
[attr.aria-invalid]="ctrl.invalid && ctrl.touched ? 'true' : null"
[attr.aria-describedby]="ctrl.invalid ? 'error-id' : null" [attr.aria-busy]="loading() ? 'true' :
null" [attr.aria-current]="page === currentPage ? 'page' : null"
```

**Live regions** :

```html
<div aria-live="polite">
  @if (subscribed()) { Message de succès } @else if (error()) { Message d'erreur }
</div>
```

---

### 17.3 Navigation clavier

- ✅ Tous les éléments interactifs focusables (`tabindex="0"` si besoin)
- ✅ Support `Enter` et `Space` pour boutons custom
- ✅ Modales : focus trap (focus bloqué dans la modale)
- ✅ Escape pour fermer modales

**Exemple** :

```html
<div
  role="button"
  tabindex="0"
  (click)="action()"
  (keydown.enter)="action()"
  (keydown.space)="action()"
>
  Cliquez-moi
</div>
```

---

### 17.4 Contraste et lisibilité

- ✅ Ratio de contraste WCAG AA (4.5:1 pour texte normal)
- ✅ Taille de police minimum 16px (body)
- ✅ Focus visible (outline bleu sur focus)

**Tailwind CSS** : Palette accessible par défaut

---

### 17.5 Images

- ✅ Alt text descriptif pour toutes les images produits
- ✅ `aria-hidden="true"` pour images décoratives
- ✅ Loading lazy (`loading="lazy"`)

**Exemple** :

```html
<img [src]="product.imageUrl" [alt]="product.title + ' par ' + product.artistName" loading="lazy" />
```

---

## Conclusion

Cette documentation couvre l'ensemble des fonctionnalités et de l'architecture du frontend Art Shop. Pour toute question ou amélioration, consulter le code source dans `src/app/`.

**Prochaines étapes suggérées** :

1. Développer le backend (NestJS, PostgreSQL, API REST)
2. Remplacer localStorage par vraies APIs
3. Ajouter tests unitaires (Jasmine/Karma)
4. Ajouter tests E2E (Cypress/Playwright)
5. Améliorer SEO (SSR avec Angular Universal)
6. Ajouter PWA (Service Worker, offline mode)
7. Internationalisation (i18n)
8. Analytics (Google Analytics, Hotjar)

**Contact** : [Votre email ou GitHub]
