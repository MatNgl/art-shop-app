import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.getCurrentUser(); // synchro
  if (user) return true;

  // Déterminer un contexte pour le CTA de login
  const url = state.url;
  const context: 'cart' | 'favorites' | 'profile' =
    url.startsWith('/cart') ? 'cart' :
      url.startsWith('/favorites') ? 'favorites' : 'profile';

  // Toast + redirection
  toast.requireAuth(context, url);

  // ⚠️ Redirige bien vers /auth/login (et pas /login)
  return router.createUrlTree(
    ['/auth/login'],
    { queryParams: { returnUrl: state.url } });
};