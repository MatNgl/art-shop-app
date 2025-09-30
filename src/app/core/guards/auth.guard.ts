import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser();

  // Non connecté → redirige login contextualisé
  if (!user) {
    const url = state.url;
    const context: 'cart' | 'favorites' | 'profile' = url.startsWith('/cart')
      ? 'cart'
      : url.startsWith('/favorites')
      ? 'favorites'
      : 'profile';

    toast.requireAuth(context, url);
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  // Connecté mais suspendu → forcer logout + rediriger
  if (auth.isSuspended(user)) {
    toast.error('Votre compte est suspendu.');
    auth.logout();
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
