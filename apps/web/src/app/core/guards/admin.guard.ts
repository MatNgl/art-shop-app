import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthHttpService as AuthService } from '../../features/auth/services/auth-http.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * AdminGuard
 * - ✅ Admin connecté → true
 * - ⛔ Non connecté → toast warning + redirection /auth/login?redirect=...
 * - ⛔ Non-admin → toast erreur + redirection /
 */
export const adminGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser();

  if (!user) {
    toast.warning('Veuillez vous connecter pour accéder à cette section.');
    return router.createUrlTree(['/auth/login'], {
      queryParams: { redirect: state.url || '/' },
    });
  }

  if (auth.isAdmin()) {
    return true;
  }

  toast.error('Accès réservé aux administrateurs.');
  return router.createUrlTree(['/']);
};
