import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { AdminArtistsComponent } from './admin-artists.component';
import { Artist } from '../../../catalog/models/product.model';
import { ArtistService } from '../../../catalog/services/artist';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { Product } from '../../../catalog/models/product.model';

describe('Gestion des artistes (AdminArtistsComponent)', () => {
    let comp: AdminArtistsComponent;

    let artistSvc: jasmine.SpyObj<
        Pick<ArtistService, 'getAll' | 'countLinkedProducts' | 'remove'>
    >;
    let productSvc: jasmine.SpyObj<Pick<ProductService, 'getAllProducts'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'warning' | 'error'>>;
    let confirm: jasmine.SpyObj<Pick<ConfirmService, 'ask'>>;
    let router: Router;

    const ARTISTS: Artist[] = [
        { id: 1, name: 'Alice', bio: 'bio A' },
        { id: 2, name: 'Bob' },
    ];

    const PRODUCTS: Product[] = [
        {
            id: 10,
            title: 'P1',
            price: 10,
            categoryId: 1,
            tags: [],
            imageUrl: '',
            images: [],
            artistId: 1,
            description: '',
            stock: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            technique: 'x',
            dimensions: { width: 1, height: 1, unit: 'cm' },
            isAvailable: true,
            isLimitedEdition: false,
        },
    ];

    beforeEach(async () => {
        artistSvc = jasmine.createSpyObj<
            Pick<ArtistService, 'getAll' | 'countLinkedProducts' | 'remove'>
        >('ArtistService', ['getAll', 'countLinkedProducts', 'remove']);
        productSvc = jasmine.createSpyObj<Pick<ProductService, 'getAllProducts'>>(
            'ProductService',
            ['getAllProducts']
        );
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'warning' | 'error'>>(
            'ToastService',
            ['success', 'warning', 'error']
        );
        confirm = jasmine.createSpyObj<Pick<ConfirmService, 'ask'>>('ConfirmService', ['ask']);

        artistSvc.getAll.and.resolveTo(ARTISTS);
        productSvc.getAllProducts.and.resolveTo(PRODUCTS);
        artistSvc.countLinkedProducts.withArgs(1, PRODUCTS).and.resolveTo(1);
        artistSvc.countLinkedProducts.withArgs(2, PRODUCTS).and.resolveTo(0);

        await TestBed.configureTestingModule({
            imports: [AdminArtistsComponent],
            providers: [
                provideRouter([]),
                { provide: ArtistService, useValue: artistSvc },
                { provide: ProductService, useValue: productSvc },
                { provide: ToastService, useValue: toast },
                { provide: ConfirmService, useValue: confirm },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(AdminArtistsComponent);
        comp = fixture.componentInstance;

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
    });

    it('se crée correctement', () => {
        expect(comp).toBeTruthy();
    });

    it('reload() → charge artistes et comptages liés', async () => {
        await comp.reload();

        expect(artistSvc.getAll).toHaveBeenCalled();
        expect(productSvc.getAllProducts).toHaveBeenCalled();

        expect(comp.linkedCount(1)).toBe(1);
        expect(comp.linkedCount(2)).toBe(0);

        expect(comp.stats().total).toBe(2);
        expect(comp.stats().withBio).toBe(1);
        expect(comp.stats().withoutBio).toBe(1);
    });

    it('filtres et tri', async () => {
        await comp.reload();

        comp.onSearchChange('ali');
        expect(comp.filteredArtists().map((a) => a.name)).toEqual(['Alice']);

        comp.onSearchChange('');
        comp.onBioFilterChange('with');
        expect(comp.filteredArtists().map((a) => a.name)).toEqual(['Alice']);

        comp.onBioFilterChange('');
        comp.onSortChange('products_desc');
        expect(comp.filteredArtists().map((a) => a.name)).toEqual(['Alice', 'Bob']);
    });

    it('remove() refuse si des produits sont liés', async () => {
        await comp.reload();
        await comp.remove(ARTISTS[0]); // Alice : 1 produit
        expect(toast.warning).toHaveBeenCalled();
        expect(confirm.ask).not.toHaveBeenCalled();
        expect(artistSvc.remove).not.toHaveBeenCalled();
    });

    it('remove() supprime si aucun produit lié et confirmation OK', async () => {
        await comp.reload();
        confirm.ask.and.resolveTo(true);
        artistSvc.remove.and.resolveTo();

        await comp.remove(ARTISTS[1]); // Bob : 0 produit
        expect(confirm.ask).toHaveBeenCalled();
        expect(artistSvc.remove).toHaveBeenCalledWith(2);
        expect(toast.success).toHaveBeenCalled();
    });

    it('create() et edit() naviguent', () => {
        comp.create();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists/new']);

        comp.edit({ id: 123, name: 'X' });
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists', 123, 'edit']);
    });
});
