import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { cartNotEmptyGuard } from './core/guards/cart-not-empty.guard';

import { PROFILE_ROUTES } from './features/profile/profile.routes';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'product/:id',
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
      import('./features/cart/pages/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
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
    path: 'profile/favorites',
    redirectTo: '/favorites',
    pathMatch: 'full',
  },
  {
    path: 'favorites',
    loadChildren: () => import('./features/favorites/favorites.routes').then(m => m.FAVORITES_ROUTES),
  },


  { path: '**', redirectTo: '', pathMatch: 'full' },
];
