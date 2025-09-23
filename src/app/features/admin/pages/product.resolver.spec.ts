import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { productResolver } from './product.resolver';
import { ProductService } from '../../catalog/services/product';

describe('productResolver', () => {
    it('is a function', () => expect(typeof productResolver).toBe('function'));

    it('returns null for invalid id param', async () => {
        const route = {
            paramMap: convertToParamMap({ id: 'not-a-number' }),
        } as unknown as ActivatedRouteSnapshot;

        const state = {} as RouterStateSnapshot;

        const mockSvc: Pick<ProductService, 'getProductById'> = {
            getProductById: jasmine.createSpy('getProductById').and.resolveTo(null),
        };

        TestBed.configureTestingModule({
            providers: [{ provide: ProductService, useValue: mockSvc }],
        });

        const res = await TestBed.runInInjectionContext(() => productResolver(route, state));
        expect(res).toBeNull();
    });
});
