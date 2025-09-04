import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    loadComponent: () =>
      import('./features/catalog/pages/product-detail/product-detail.component').then(
        (c) => c.ProductDetailComponent
      ),
  },
  {
    path: 'profile/favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/pages/favorites/favorites.component').then(
        (c) => c.FavoritesComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/cart/pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'cart/confirmation/:id',
    loadComponent: () =>
      import('./features/cart/pages/confirmation/confirmation.component').then(
        (m) => m.ConfirmationComponent
      ),
  },
  {
    path: 'profile/orders',
    loadComponent: () =>
      import('./features/profile/pages/order/orders.component').then(
        (m) => m.ProfileOrdersComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
