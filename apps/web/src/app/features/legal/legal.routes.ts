import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'cookies',
    loadComponent: () => import('./pages/cookies.page').then((m) => m.CookiesPage),
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq.page').then((m) => m.FaqPage),
  },
  {
    path: 'shipping',
    loadComponent: () => import('./pages/shipping.page').then((m) => m.ShippingPage),
  },
  {
    path: '',
    redirectTo: 'terms',
    pathMatch: 'full',
  },
];
