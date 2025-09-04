import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser(); // synchro
  return user ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
