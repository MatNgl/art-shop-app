import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { productResolver } from './product.resolver';
import { ProductService } from '../../catalog/services/product';

describe('Résolveur de produit (productResolver)', () => {
    it('est bien une fonction', () => {
        expect(typeof productResolver).toBe('function');
    });

    it('Retourne null si l’ID passé en paramètre est invalide', async () => {
        // Préparation d’une fausse route avec un paramètre "id" non numérique
        const route = {
            paramMap: convertToParamMap({ id: 'not-a-number' }),
        } as unknown as ActivatedRouteSnapshot;

        const state = {} as RouterStateSnapshot;

        // Service mocké : ici on espionne getProductById mais il ne sera pas appelé
        const mockSvc: Pick<ProductService, 'getProductById'> = {
            getProductById: jasmine.createSpy('getProductById').and.resolveTo(null),
        };

        // Injection du service mock dans le contexte de test
        TestBed.configureTestingModule({
            providers: [{ provide: ProductService, useValue: mockSvc }],
        });

        // Exécution du resolver dans le contexte d’injection Angular
        const res = await TestBed.runInInjectionContext(() => productResolver(route, state));

        // Comme l’ID n’est pas valide → on attend un retour null
        expect(res).toBeNull();
    });
});
