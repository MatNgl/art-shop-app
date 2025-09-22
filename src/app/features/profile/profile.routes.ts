import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

import { ProfileLayoutComponent } from './pages/profile-layout/profile-layout.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AddressesComponent } from './pages/addresses/addresses.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ProfileOrdersComponent } from './pages/orders/orders.component';

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
        ],
    },
];
