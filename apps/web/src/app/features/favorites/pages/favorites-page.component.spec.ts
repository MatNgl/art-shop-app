import { TestBed } from '@angular/core/testing';
import { FavoritesPageComponent } from './favorites-page.component';
import { provideRouter } from '@angular/router';
import { FavoritesStore } from '../services/favorites-store';
import { ProductService } from '../../catalog/services/product';
import { ToastService } from '../../../shared/services/toast.service';
import type { Product } from '../../catalog/models/product.model';

// Spies strictement typés
type TFav = Pick<FavoritesStore, 'ids'>;
type TProductSvc = Pick<ProductService, 'getAllProducts'>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;

// Fabrique locale conforme à ton modèle (réutilisable)
function makeProduct(
    id: number,
    title: string,
    opts?: {
        artistId?: number; images?: string[]; price?: number; isAvailable?: boolean; categoryId?: number;
        originalPrice?: number; stock?: number; technique?: string;
        dimensions?: { width: number; height: number; depth?: number; unit: 'cm' | 'inches' };
        isLimitedEdition?: boolean;
    }
): Product {
    const now = new Date();
    return {
        id, title, description: 'Description courte',
        price: opts?.price ?? 100,
        originalPrice: opts?.originalPrice,
        categoryId: opts?.categoryId,
        tags: [],
        imageUrl: (opts?.images?.[0] ?? ''),
        images: opts?.images ?? [],
        artistId: opts?.artistId ?? 10,
        technique: opts?.technique ?? 'Technique',
        dimensions: opts?.dimensions ?? { width: 10, height: 10, unit: 'cm' },
        isAvailable: opts?.isAvailable ?? true,
        stock: opts?.stock ?? 10,
        isLimitedEdition: opts?.isLimitedEdition ?? false,
        createdAt: now,
        updatedAt: now,
    } as Product;
}

describe(' Page Favoris (FavoritesPageComponent)', () => {
    let favSpy: jasmine.SpyObj<TFav>;
    let productSpy: jasmine.SpyObj<TProductSvc>;
    let toastSpy: jasmine.SpyObj<TToast>;

    beforeEach(async () => {
        favSpy = jasmine.createSpyObj<TFav>('FavoritesStore', ['ids']);
        productSpy = jasmine.createSpyObj<TProductSvc>('ProductService', ['getAllProducts']);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);

        await TestBed.configureTestingModule({
            imports: [FavoritesPageComponent], // standalone
            providers: [
                provideRouter([]),
                { provide: FavoritesStore, useValue: favSpy },
                { provide: ProductService, useValue: productSpy },
                { provide: ToastService, useValue: toastSpy },
            ],
        }).compileComponents();
    });

    it('affiche la liste des favoris correspondant aux IDs du store', async () => {
        const all = [
            makeProduct(1, 'Alpha'),
            makeProduct(2, 'Beta'),
            makeProduct(3, 'Gamma'),
        ];
        favSpy.ids.and.returnValue([1, 3]);
        productSpy.getAllProducts.and.resolveTo(all);

        const fixture = TestBed.createComponent(FavoritesPageComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.products().map(p => p.id)).toEqual([1, 3]);
        expect(productSpy.getAllProducts).toHaveBeenCalled();
    });

    it('affiche un état vide quand aucun favori', async () => {
        favSpy.ids.and.returnValue([]);
        productSpy.getAllProducts.and.resolveTo([
            makeProduct(10, 'X'),
            makeProduct(11, 'Y'),
        ]);

        const fixture = TestBed.createComponent(FavoritesPageComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.products().length).toBe(0);
        expect(toastSpy.error).not.toHaveBeenCalled();
    });

    it('gère une erreur non-Error par un toast local et vide la liste', async () => {
        favSpy.ids.and.returnValue([1]);
        productSpy.getAllProducts.and.rejectWith('weird');

        const fixture = TestBed.createComponent(FavoritesPageComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.products().length).toBe(0);
        expect(toastSpy.error).toHaveBeenCalledWith('Erreur inattendue lors du chargement des favoris.');
    });

    it('ne toast pas si l’erreur est une Error (déjà gérée par interceptor)', async () => {
        favSpy.ids.and.returnValue([1, 2]);
        productSpy.getAllProducts.and.rejectWith(new Error('HTTP 500'));

        const fixture = TestBed.createComponent(FavoritesPageComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.products().length).toBe(0);
        expect(toastSpy.error).not.toHaveBeenCalled();
    });

    it('trackById retourne l’ID du produit', () => {
        const fixture = TestBed.createComponent(FavoritesPageComponent);
        const comp = fixture.componentInstance;
        const p = makeProduct(42, 'Test');
        expect(comp.trackById(0, p)).toBe(42);
    });
});
