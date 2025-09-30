import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const adminGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser();

  if (!user) {
    toast.requireAuth('profile', state.url);
    return router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } });
  }

  if (auth.isSuspended(user)) {
    toast.error('Votre compte est suspendu.');
    auth.logout();
    return router.createUrlTree(['/auth/login']);
  }

  if (user.role === 'admin') {
    return true;
  }

  toast.error('Accès réservé aux administrateurs.');
  return router.createUrlTree(['/']);
};
