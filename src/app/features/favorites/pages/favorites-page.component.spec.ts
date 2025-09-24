import { TestBed } from '@angular/core/testing';
import { FavoritesPageComponent } from './favorites-page.component';
import { ProductService } from '../../catalog/services/product';
import { FavoritesStore } from '../services/favorites-store';
import { ToastService } from '../../../shared/services/toast.service';
import { Product } from '../../catalog/models/product.model';

describe('Page favoris (FavoritesPageComponent)', () => {
    let productSvc: jasmine.SpyObj<Pick<ProductService, 'getAllProducts'>>;
    let favStore: jasmine.SpyObj<Pick<FavoritesStore, 'ids'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'error'>>;
    let comp: FavoritesPageComponent;

    beforeEach(async () => {
        productSvc = jasmine.createSpyObj<Pick<ProductService, 'getAllProducts'>>(
            'ProductService',
            ['getAllProducts']
        );
        favStore = jasmine.createSpyObj<Pick<FavoritesStore, 'ids'>>('FavoritesStore', ['ids']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'error'>>('ToastService', ['error']);

        await TestBed.configureTestingModule({
            imports: [FavoritesPageComponent],
            providers: [
                { provide: ProductService, useValue: productSvc },
                { provide: FavoritesStore, useValue: favStore },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(FavoritesPageComponent);
        comp = fixture.componentInstance;
    });

    it('se crée correctement', () => {
        expect(comp).toBeTruthy();
    });

    it('ngOnInit → récupère les produits et applique le filtre favoris', async () => {
        // objets minimaux : on évite de construire tout Product
        const productsMinimal = [{ id: 1 }, { id: 2 }] as unknown as Product[];
        productSvc.getAllProducts.and.returnValue(Promise.resolve(productsMinimal));
        favStore.ids.and.returnValue([1]);

        await comp.ngOnInit();

        expect(comp.products().length).toBe(1);
        expect(comp.loading()).toBeFalse();
    });

    it('ngOnInit → en cas derreur, pas de double-toast et état cohérent', async () => {
        productSvc.getAllProducts.and.throwError('boom');
        favStore.ids.and.returnValue([]);

        await comp.ngOnInit();

        expect(toast.error).not.toHaveBeenCalled();
        expect(comp.products().length).toBe(0);
        expect(comp.loading()).toBeFalse();
    });
});
