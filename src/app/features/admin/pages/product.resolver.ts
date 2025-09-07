// src/app/features/admin/pages/product.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductService } from '../../catalog/services/product';
import { Product } from '../../catalog/models/product.model';

export const productResolver: ResolveFn<Product | null> = async (route) => {
  const svc = inject(ProductService);
  const idParam = route.paramMap.get('id');
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isFinite(id)) return null;
  return await svc.getProductById(id);
};
