import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-settings-layout.component').then((c) => c.AdminSettingsLayoutComponent),
    children: [
      { path: '', redirectTo: 'badges', pathMatch: 'full' },
      {
        path: 'badges',
        loadComponent: () =>
          import('./admin-badge-themes.component').then((c) => c.AdminBadgeThemesComponent),
      },
      {
        path: 'general',
        loadComponent: () =>
          import('./admin-settings-general.component').then((c) => c.AdminSettingsGeneralComponent),
      },
      {
        path: 'appearance',
        loadComponent: () =>
          import('./admin-settings-appearance.component').then(
            (c) => c.AdminSettingsAppearanceComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./admin-settings-notifications.component').then(
            (c) => c.AdminSettingsNotificationsComponent
          ),
      },
    ],
  },
];
