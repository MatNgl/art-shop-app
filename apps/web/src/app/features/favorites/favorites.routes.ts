import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const FAVORITES_ROUTES: Routes = [
    {
        path: '',
        canActivate: [authGuard], // garde si nécessaire
        loadComponent: () =>
            import('./pages/favorites-page.component').then(m => m.FavoritesPageComponent),
    },
];
