import { Routes } from '@angular/router';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/messaging.page').then(m => m.MessagingPage),
  },
];
