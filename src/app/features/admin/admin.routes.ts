// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { productResolver } from './pages/product.resolver';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent
      ),
  },

  // --- PRODUITS ---
  {
    path: 'products',
    loadComponent: () =>
      import('./components/products/admin-products.component').then(
        (c) => c.AdminProductsComponent
      ),
  },
  {
    path: 'products/new',
    loadComponent: () => import('./pages/create-product.page').then((m) => m.CreateProductPage),
  },
  {
    path: 'products/:id/edit',
    resolve: { product: productResolver },
    loadComponent: () => import('./pages/edit-product.page').then((m) => m.EditProductPage),
  },

  // --- ARTISTES ---
  {
    path: 'artists',
    loadComponent: () =>
      import('./components/artists/admin-artists.component').then((c) => c.AdminArtistsComponent),
  },
  {
    path: 'artists/new',
    loadComponent: () => import('./pages/create-artist.page').then((c) => c.CreateArtistPage),
  },
  {
    path: 'artists/:id/edit',
    loadComponent: () => import('./pages/edit-artist.page').then((c) => c.EditArtistPage),
  },

  // --- UTILISATEURS ---
  {
    path: 'users',
    loadComponent: () =>
      import('./components/users/admin-users.component').then((c) => c.AdminUsersComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./pages/user-details.page').then((c) => c.UserDetailsPage),
  },
  // --- COMMANDES ---
  {
    path: 'orders',
    loadComponent: () =>
      import('./components/orders/admin-orders.component').then((c) => c.AdminOrdersComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./pages/order-details.page').then((c) => c.OrderDetailsPage),
  },

  // --- CATÉGORIES ---
  // {
  //   path: 'categories',
  //   loadComponent: () =>
  //     import('./components/categories/admin-categories.component').then(
  //       (c) => c.AdminCategoriesComponent
  //     ),
  // },

  // // --- PARAMÈTRES ---
  // {
  //   path: 'settings',
  //   loadComponent: () =>
  //     import('./components/settings/admin-settings.component').then(
  //       (c) => c.AdminSettingsComponent
  //     ),
  // },
];
