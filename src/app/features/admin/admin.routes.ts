import { Routes } from '@angular/router';
import { productResolver } from './pages/product.resolver';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
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
  {
    path: 'categories',
    loadComponent: () =>
      import('./components/categories/admin-categories.component').then(
        (m) => m.AdminCategoriesComponent
      ),
  },
  {
    path: 'categories/new',
    loadComponent: () => import('./pages/create-category-page').then((m) => m.CreateCategoryPage),
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () => import('./pages/edit-category-page').then((m) => m.EditCategoryPage),
  },

  // --- PROMOTIONS ---
  {
    path: 'promotions',
    loadChildren: () =>
      import('../promotions/promotions.routes').then((m) => m.PROMOTIONS_ROUTES),
  },

  // // --- PARAMÈTRES ---
  // {
  //   path: 'settings',
  //   loadComponent: () =>
  //     import('./components/settings/admin-settings.component').then(
  //       (c) => c.AdminSettingsComponent
  //     ),
  // },
];
