import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

import { ProfileLayoutComponent } from './pages/profile-layout/profile-layout.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AddressesComponent } from './pages/addresses/profile-addresses.component';
import { PaymentsComponent } from './pages/payments/profile-payments.component';
import { ProfileOrdersComponent } from './pages/orders/profile-orders.component';
import { ProfileFavoritesComponent } from './pages/favorites/profile-favorites.component';
import { ProfileCartComponent } from './pages/cart/profile-cart.component';

export const PROFILE_ROUTES: Routes = [
  {
    path: 'profile',
    canActivate: [authGuard],
    component: ProfileLayoutComponent,
    children: [
      { path: '', component: ProfileComponent },
      { path: 'addresses', component: AddressesComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'orders', component: ProfileOrdersComponent },
      { path: 'favorites', component: ProfileFavoritesComponent },
      { path: 'cart', component: ProfileCartComponent },
      {
        path: 'fidelity',
        loadComponent: () =>
          import('../fidelity/pages/user-fidelity/user-fidelity.page').then(
            (m) => m.UserFidelityPage
          ),
      },
    ],
  },
];
