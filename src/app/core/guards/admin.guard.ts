import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const adminGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser(); // synchro

  if (user?.role === 'admin') {
    return true;
  }

  if (!user) {
    // au cas où l'ordre des guards change, on gère le non-authentifié proprement
    toast.requireAuth('profile', state.url);
    return router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } });
  }

  toast.error('Accès réservé aux administrateurs.');
  // évite la boucle infinie vers /admin → renvoie vers l’accueil (ou autre page publique)
  return router.createUrlTree(['/']);
};
