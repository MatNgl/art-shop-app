// FILE: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { cartNotEmptyGuard } from './core/guards/cart-not-empty.guard';
import { PROFILE_ROUTES } from './features/profile/profile.routes';
import { productAvailableGuard } from './core/guards/product-available.guard'; // ⬅️ import

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'product/:id',
    canActivate: [productAvailableGuard],
    loadComponent: () =>
      import('./features/catalog/pages/product-detail/product-detail.component').then(
        (c) => c.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard, cartNotEmptyGuard],
    loadComponent: () =>
      import('./features/cart/pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'cart/confirmation/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/pages/confirmation/confirmation.component').then(
        (m) => m.ConfirmationComponent
      ),
  },
  ...PROFILE_ROUTES,
  {
    path: 'favorites',
    loadChildren: () =>
      import('./features/favorites/favorites.routes').then((m) => m.FAVORITES_ROUTES),
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('./features/promotions/pages/promotions-public.component').then(
        (m) => m.PromotionsListComponent
      ),
  },
  {
    path: 'fidelity',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/fidelity/pages/user-fidelity/user-fidelity.page').then(
        (m) => m.UserFidelityPage
      ),
  },
  {
    path: 'subscriptions',
    loadChildren: () => import('./features/subscriptions/subscriptions.routes'),
  },
  {
    path: 'legal',
    loadChildren: () => import('./features/legal/legal.routes').then((m) => m.LEGAL_ROUTES),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/pages/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./features/help/pages/help.page').then((m) => m.HelpPage),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./shared/pages/not-found.page').then((m) => m.NotFoundPage),
  },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];
