import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((c) => c.LoginComponent),
    data: { hideSidebar: true, hideFooter: true },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((c) => c.RegisterComponent),
    data: { hideSidebar: true, hideFooter: true },
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./components/change-password/change-password.component').then(
        (c) => c.ChangePasswordComponent
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
