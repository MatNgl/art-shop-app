import { TestBed } from '@angular/core/testing';
import { FavoritesPageComponent } from './favorites-page.component';
import { ProductService } from '../../catalog/services/product';
import { FavoritesStore } from '../services/favorites-store';
import { ToastService } from '../../../shared/services/toast.service';
import { Product } from '../../catalog/models/product.model';

describe('FavoritesPageComponent', () => {
    let productSvc: jasmine.SpyObj<ProductService>;
    let favStore: jasmine.SpyObj<FavoritesStore>;
    let toast: jasmine.SpyObj<ToastService>;
    let comp: FavoritesPageComponent;

    beforeEach(async () => {
        productSvc = jasmine.createSpyObj('ProductService', ['getAllProducts']);
        favStore = jasmine.createSpyObj('FavoritesStore', ['ids']);
        toast = jasmine.createSpyObj('ToastService', ['error']);

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

    it('should create', () => {
        expect(comp).toBeTruthy();
    });

    it('ngOnInit sets products when service returns list', async () => {
        // on ne veut pas fabriquer tout Product — on caste proprement via unknown
        const productsMinimal = [{ id: 1 }, { id: 2 }] as unknown as Product[];
        (productSvc.getAllProducts as jasmine.Spy).and.returnValue(Promise.resolve(productsMinimal));
        (favStore.ids as jasmine.Spy).and.returnValue([1]);

        await comp.ngOnInit();

        expect(comp.products().length).toBe(1);
        expect(comp.loading()).toBeFalse();
    });

    it('ngOnInit handles error and does not re-toast HTTP errors', async () => {
        (productSvc.getAllProducts as jasmine.Spy).and.throwError('boom');
        (favStore.ids as jasmine.Spy).and.returnValue([]);

        await comp.ngOnInit();

        expect(toast.error).not.toHaveBeenCalled();
        expect(comp.products().length).toBe(0);
        expect(comp.loading()).toBeFalse();
    });
});
