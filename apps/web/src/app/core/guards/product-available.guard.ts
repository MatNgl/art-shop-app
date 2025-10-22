import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { ProductService } from '../../features/catalog/services/product';
import { ToastService } from '../../shared/services/toast.service';

export const productAvailableGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const productService = inject(ProductService);
  const toast = inject(ToastService);

  const idParam = route.paramMap.get('id');
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isFinite(id)) {
    // id invalide → redirige vers le catalogue
    return router.createUrlTree(['/catalog']);
  }

  const product = await productService.getPublicProductById(id);
  if (!product) {
    toast.info('Ce produit n’est plus disponible.');
    return router.createUrlTree(['/catalog']);
  }

  return true;
};
