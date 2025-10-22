// src/app/features/subscriptions/subscriptions.routes.ts
import { Routes } from '@angular/router';
import { SubscriptionsCatalogComponent } from './pages/subscriptions-catalog/subscriptions-catalog.component';

const routes: Routes = [
  {
    path: '',
    title: 'Abonnements',
    children: [
      { path: '', component: SubscriptionsCatalogComponent },
      // futur : /subscriptions/:slug pour une page dédiée si nécessaire
    ],
  },
];

export default routes;
