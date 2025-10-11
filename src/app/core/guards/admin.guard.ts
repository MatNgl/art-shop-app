import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';
import { UserRole } from '../../features/auth/models/user.model';

/**
 * AdminGuard
 * - ✅ Admin connecté → true
 * - ⛔ Compte suspendu → toast erreur + logout + redirection /auth/login
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

  if (auth.isSuspended(user)) {
    toast.error('Votre compte est suspendu.');
    void auth.logout();
    return router.createUrlTree(['/auth/login']);
  }

  if (user.role === UserRole.ADMIN) {
    return true;
  }

  toast.error('Accès réservé aux administrateurs.');
  return router.createUrlTree(['/']);
};
