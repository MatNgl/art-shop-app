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
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(
        (c) => c.ForgotPasswordComponent
      ),
    data: { hideSidebar: true, hideFooter: true },
  },
  {
    path: 'reset/:token',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(
        (c) => c.ResetPasswordComponent
      ),
    data: { hideSidebar: true, hideFooter: true },
  },
  {
    path: 'oauth/callback',
    loadComponent: () =>
      import('./pages/oauth-callback/oauth-callback.component').then(
        (c) => c.OAuthCallbackComponent
      ),
    data: { hideSidebar: true, hideFooter: true },
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
