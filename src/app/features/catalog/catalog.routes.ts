import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogComponent },
  // { path: 'product/:id', component: ProductDetailComponent }, // À créer plus tard
];
