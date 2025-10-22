import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/overview/overview.component').then(
            (m) => m.OverviewComponent
          ),
        title: 'Vue d\'ensemble - Dashboard Admin',
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales.component').then(
            (m) => m.SalesComponent
          ),
        title: 'Ventes - Dashboard Admin',
      },
      {
        path: 'stocks',
        loadComponent: () =>
          import('./pages/stocks/stocks.component').then(
            (m) => m.StocksComponent
          ),
        title: 'Stocks - Dashboard Admin',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(
            (m) => m.UsersComponent
          ),
        title: 'Utilisateurs - Dashboard Admin',
      },
      {
        path: 'admin-activity',
        loadComponent: () =>
          import('./pages/admin-activity/admin-activity.component').then(
            (m) => m.AdminActivityComponent
          ),
        title: 'Administration - Dashboard Admin',
      },
    ],
  },
];
