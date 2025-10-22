import { Routes } from '@angular/router';
import { PromotionsListComponent } from './pages/promotions-list.component';
import { PromotionFormComponent } from './pages/promotion-form.component';

export const PROMOTIONS_ROUTES: Routes = [
  {
    path: '',
    component: PromotionsListComponent,
  },
  {
    path: 'new',
    component: PromotionFormComponent,
  },
  {
    path: 'edit/:id',
    component: PromotionFormComponent,
  },
];
