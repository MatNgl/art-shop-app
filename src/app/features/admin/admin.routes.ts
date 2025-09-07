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
];
