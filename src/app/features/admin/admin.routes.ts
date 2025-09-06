// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent
      ),
  },
  // Routes futures pour les autres sections
  // {
  //   path: 'products',
  //   loadComponent: () =>
  //     import('./components/products/admin-products.component').then(
  //       (c) => c.AdminProductsComponent
  //     ),
  // },
  // {
  //   path: 'artists',
  //   loadComponent: () =>
  //     import('./components/artists/admin-artists.component').then(
  //       (c) => c.AdminArtistsComponent
  //     ),
  // },
  // {
  //   path: 'categories',
  //   loadComponent: () =>
  //     import('./components/categories/admin-categories.component').then(
  //       (c) => c.AdminCategoriesComponent
  //     ),
  // },
  // {
  //   path: 'orders',
  //   loadComponent: () =>
  //     import('./components/orders/admin-orders.component').then(
  //       (c) => c.AdminOrdersComponent
  //     ),
  // },
  // {
  //   path: 'users',
  //   loadComponent: () =>
  //     import('./components/users/admin-users.component').then(
  //       (c) => c.AdminUsersComponent
  //     ),
  // },
];
