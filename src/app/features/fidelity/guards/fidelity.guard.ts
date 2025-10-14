import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FidelityStore } from '../services/fidelity-store';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Guard fonctionnel qui vérifie si le programme de fidélité est activé.
 * Redirige vers /profile si désactivé.
 */
export const fidelityGuard: CanActivateFn = () => {
  const fidelityStore = inject(FidelityStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!fidelityStore.isEnabled()) {
    toast.info('Le programme de fidélité n\'est pas disponible pour le moment.');
    return router.parseUrl('/profile');
  }

  return true;
};
