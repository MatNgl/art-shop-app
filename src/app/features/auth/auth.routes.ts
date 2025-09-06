// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((c) => c.LoginComponent),
    data: { hideHeader: true, hideSidebar: true, hideFooter: true },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((c) => c.RegisterComponent),
    data: { hideHeader: true, hideSidebar: true, hideFooter: true },
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
