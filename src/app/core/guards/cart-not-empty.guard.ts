import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { CartStore } from '../../features/cart/services/cart-store';

export const cartNotEmptyGuard: CanActivateFn = (): boolean | UrlTree => {
  const cart = inject(CartStore);
  const router = inject(Router);

  // autorise si au moins 1 article, sinon redirige vers /cart
  return cart.count() > 0 ? true : router.createUrlTree(['/cart']);
};
