import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminProductsComponent } from './admin-products.component';
import { ProductService } from '../../../catalog/services/product';
import { CategoryService } from '../../../catalog/services/category';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import type { Product } from '../../../catalog/models/product.model';
import { User, UserRole } from '../../../auth/models/user.model';
import type { Category } from '../../../catalog/models/category.model';

type TAuth = Pick<AuthService, 'getCurrentUser'>;
type TProduct = Pick<ProductService, 'getAll' | 'updateProductAvailability' | 'deleteProduct'>;
type TCategory = Pick<CategoryService, 'getAll'>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TConfirm = Pick<ConfirmService, 'ask'>;

function makeProduct(
    id: number,
    title: string,
    opts?: Partial<Product>
): Product {
    const now = new Date();
    return {
        id,
        title,
        description: 'Desc',
        originalPrice: 100,
        tags: [],
        imageUrl: '',
        images: [],
        artistId: 1,
        technique: 'Tech',
        dimensions: { width: 10, height: 10, unit: 'cm' },
        isAvailable: true,
        stock: 5,
        isLimitedEdition: false,
        createdAt: now,
        updatedAt: now,
        ...opts,
    } as Product;
}

describe('Page admin Produits', () => {
    let router: Router;
    let authSpy: jasmine.SpyObj<TAuth>;
    let productSpy: jasmine.SpyObj<TProduct>;
    let categorySpy: jasmine.SpyObj<TCategory>;
    let toastSpy: jasmine.SpyObj<TToast>;
    let confirmSpy: jasmine.SpyObj<TConfirm>;

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<TAuth>('AuthService', ['getCurrentUser']);
        productSpy = jasmine.createSpyObj<TProduct>('ProductService', [
            'getAll',
            'updateProductAvailability',
            'deleteProduct',
        ]);
        categorySpy = jasmine.createSpyObj<TCategory>('CategoryService', ['getAll']);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);
        confirmSpy = jasmine.createSpyObj<TConfirm>('ConfirmService', ['ask']);

        await TestBed.configureTestingModule({
            imports: [AdminProductsComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authSpy },
                { provide: ProductService, useValue: productSpy },
                { provide: CategoryService, useValue: categorySpy },
                { provide: ToastService, useValue: toastSpy },
                { provide: ConfirmService, useValue: confirmSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
    });

    it('redirige vers accueil si non admin', async () => {
        const nonAdminUser: User = {
            id: 2,
            email: 'user@example.com',
            firstName: 'U',
            lastName: 'ser',
            role: UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(nonAdminUser);
        const fixture = TestBed.createComponent(AdminProductsComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    const adminUser: User = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Istrator',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it('charge produits + catégories et calcule les stats', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        productSpy.getAll.and.resolveTo([
            makeProduct(1, 'Alpha', { isAvailable: true, originalPrice: 100 }),
            makeProduct(2, 'Beta', { isAvailable: false, originalPrice: 200 }),
            makeProduct(3, 'Gamma', { isAvailable: true, originalPrice: 300 }),
        ]);
        categorySpy.getAll.and.resolveTo([
            { id: 1, name: 'Dessin', slug: 'dessin', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 2, name: 'Peinture', slug: 'peinture', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ] as Category[]);

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.products().length).toBe(3);
        expect(comp.categories().length).toBe(2);

        const s = comp.stats();
        expect(s.total).toBe(3);
        expect(s.available).toBe(2);
        expect(s.unavailable).toBe(1);
        expect(s.avgPrice).toBeCloseTo((100 + 200 + 300) / 3, 6);
    });

    it('filtre par texte, catégorie, disponibilité et trie par prix croissant', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        productSpy.getAll.and.resolveTo([
            makeProduct(1, 'Zèbre', { originalPrice: 300, categoryId: 2, isAvailable: true }),
            makeProduct(2, 'Antilope', { originalPrice: 100, categoryId: 1, isAvailable: false }),
            makeProduct(3, 'Baleine', { originalPrice: 200, categoryId: 1, isAvailable: true }),
        ]);
        categorySpy.getAll.and.resolveTo([
            { id: 1, name: 'Dessin', slug: 'dessin', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 2, name: 'Peinture', slug: 'peinture', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ] as Category[]);

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        comp.onSearchChange('e'); // présent dans tous, on restreint ensuite
        comp.onCategoryChange(1);
        comp.onAvailabilityChange('available');
        comp.onSortChange('price_asc');

        const arr = comp.filteredProducts();
        expect(arr.map(p => p.id)).toEqual([3]); // id=3 correspond aux critères (cat=1, dispo=true), prix=200
    });

    it('bascule disponibilité après confirmation et notifie', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        const p = makeProduct(7, 'Piece', { isAvailable: true });
        productSpy.getAll.and.resolveTo([p]);
        categorySpy.getAll.and.resolveTo([]);
        confirmSpy.ask.and.resolveTo(true);
        productSpy.updateProductAvailability.and.resolveTo();

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.toggleAvailability(p);
        expect(confirmSpy.ask).toHaveBeenCalled();
        expect(productSpy.updateProductAvailability).toHaveBeenCalledWith(7, false);
        expect(productSpy.getAll).toHaveBeenCalledTimes(2);
        expect(toastSpy.success).toHaveBeenCalled();
    });

    it('ne bascule pas la disponibilité si annulation', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        const p = makeProduct(8, 'NoOp', { isAvailable: false });
        productSpy.getAll.and.resolveTo([p]);
        categorySpy.getAll.and.resolveTo([]);
        confirmSpy.ask.and.resolveTo(false);

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.toggleAvailability(p);
        expect(productSpy.updateProductAvailability).not.toHaveBeenCalled();
    });

    it('supprime un produit après confirmation puis recharge', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        const p = makeProduct(9, 'DeleteMe');
        productSpy.getAll.and.resolveTo([p]);
        categorySpy.getAll.and.resolveTo([]);
        confirmSpy.ask.and.resolveTo(true);
        productSpy.deleteProduct.and.resolveTo();

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.deleteProduct(p);
        expect(productSpy.deleteProduct).toHaveBeenCalledWith(9);
        expect(productSpy.getAll).toHaveBeenCalledTimes(2);
        expect(toastSpy.success).toHaveBeenCalledWith('Produit supprimé.');
    });

    it('navigue vers création et édition', async () => {
        authSpy.getCurrentUser.and.returnValue(adminUser);
        productSpy.getAll.and.resolveTo([]);
        categorySpy.getAll.and.resolveTo([]);

        const fixture = TestBed.createComponent(AdminProductsComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        comp.createProduct();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/products/new']);

        comp.editProduct(makeProduct(42, 'X'));
        expect(router.navigate).toHaveBeenCalledWith(['/admin/products', 42, 'edit']);
    });
});
