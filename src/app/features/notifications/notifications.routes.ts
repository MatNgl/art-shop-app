import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notifications-page.component').then(m => m.NotificationsPageComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/alert-settings.page').then(m => m.AlertSettingsPage),
  },
];
