import { Routes } from '@angular/router';
import { HomeComponent } from '../home/components/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogComponent },
];
