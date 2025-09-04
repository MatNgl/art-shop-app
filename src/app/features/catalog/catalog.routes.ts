import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CatalogComponent } from './components/catalog/catalog.component';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogComponent },
  // { path: 'product/:id', component: ProductDetailComponent }, // À créer plus tard
];
