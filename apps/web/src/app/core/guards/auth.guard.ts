import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthHttpService as AuthService } from '../../features/auth/services/auth-http.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * AuthGuard
 * - ✅ Si utilisateur connecté → true
 * - ⛔ Sinon → toast contextuel + redirection vers /auth/login?returnUrl=...
 * NB: AUCUN appel à isSuspended ici (géré par adminGuard).
 */
export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser();
  if (user) {
    return true;
  }

  const url = state.url || '/';
  const lower = url.toLowerCase();
  const context: 'cart' | 'favorites' | 'profile' = lower.startsWith('/cart')
    ? 'cart'
    : lower.startsWith('/favorites')
    ? 'favorites'
    : 'profile';

  toast.requireAuth(context, url);

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: url },
  });
};
