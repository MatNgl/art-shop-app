import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { CartStore } from '../../features/cart/services/cart-store';
import { ToastService } from '../../shared/services/toast.service';

export const cartNotEmptyGuard: CanActivateFn = (): boolean | UrlTree => {
    const cart = inject(CartStore);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (cart.count() > 0) {
        return true;
    }

    toast.info('Votre panier est vide.');
    return router.createUrlTree(['/cart']);
};
