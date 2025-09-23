// src/app/features/admin/pages/admin-artists.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AdminArtistsComponent } from './admin-artists.component';
import { Artist } from '../../../catalog/models/product.model';
import { ArtistService } from '../../../catalog/services/artist';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { Product } from '../../../catalog/models/product.model';

describe('AdminArtistsComponent', () => {
    let comp: AdminArtistsComponent;

    // Spies
    let artistSvc: jasmine.SpyObj<ArtistService>;
    let productSvc: jasmine.SpyObj<ProductService>;
    let toast: jasmine.SpyObj<ToastService>;
    let confirm: jasmine.SpyObj<ConfirmService>;
    let router: Router;

    const ARTISTS: Artist[] = [
        { id: 1, name: 'Alice', bio: 'bio A' },
        { id: 2, name: 'Bob' },
    ];

    const PRODUCTS: Product[] = [
        {
            id: 10, title: 'P1', price: 10, categoryId: 1, tags: [], imageUrl: '', images: [], artistId: 1,
            description: '', stock: 0, createdAt: new Date(), updatedAt: new Date(),
            // champs requis par ton modèle :
            technique: 'x', dimensions: { width: 1, height: 1, unit: 'cm' },
            isAvailable: true, isLimitedEdition: false
        },
    ];

    beforeEach(async () => {
        artistSvc = jasmine.createSpyObj<ArtistService>('ArtistService', [
            'getAll',
            'countLinkedProducts',
            'remove',
        ]);
        productSvc = jasmine.createSpyObj<ProductService>('ProductService', ['getAllProducts']);
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'warning', 'error']);
        confirm = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['ask']);

        artistSvc.getAll.and.resolveTo(ARTISTS);
        productSvc.getAllProducts.and.resolveTo(PRODUCTS);
        // 1 produit lié à l’artiste 1, 0 produit pour l’artiste 2
        artistSvc.countLinkedProducts.withArgs(1, PRODUCTS).and.resolveTo(1);
        artistSvc.countLinkedProducts.withArgs(2, PRODUCTS).and.resolveTo(0);

        await TestBed.configureTestingModule({
            imports: [AdminArtistsComponent, RouterTestingModule],
            providers: [
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

    it('should create', () => {
        expect(comp).toBeTruthy();
    });

    it('reload() charge artistes et compte les produits liés', async () => {
        await comp.reload();

        expect(artistSvc.getAll).toHaveBeenCalled();
        expect(productSvc.getAllProducts).toHaveBeenCalled();

        // counts: {1:1, 2:0}
        expect(comp.linkedCount(1)).toBe(1);
        expect(comp.linkedCount(2)).toBe(0);

        // stats cohérentes
        expect(comp.stats().total).toBe(2);
        expect(comp.stats().withBio).toBe(1);
        expect(comp.stats().withoutBio).toBe(1);
    });

    it('filtre et tri fonctionnent', async () => {
        await comp.reload();

        comp.onSearchChange('ali'); // match "Alice"
        expect(comp.filteredArtists().map(a => a.name)).toEqual(['Alice']);

        comp.onSearchChange('');
        comp.onBioFilterChange('with'); // only artists with bio
        expect(comp.filteredArtists().map(a => a.name)).toEqual(['Alice']);

        comp.onBioFilterChange('');
        comp.onSortChange('products_desc');
        const namesDesc = comp.filteredArtists().map(a => a.name);
        // Alice (1 produit) avant Bob (0)
        expect(namesDesc).toEqual(['Alice', 'Bob']);
    });

    it('remove() refuse si produits liés > 0', async () => {
        await comp.reload();
        await comp.remove(ARTISTS[0]); // Alice a 1 produit
        expect(toast.warning).toHaveBeenCalled();
        expect(confirm.ask).not.toHaveBeenCalled();
        expect(artistSvc.remove).not.toHaveBeenCalled();
    });

    it('remove() supprime si pas de produits liés et confirmation OK', async () => {
        await comp.reload();
        confirm.ask.and.resolveTo(true);
        artistSvc.remove.and.resolveTo();

        await comp.remove(ARTISTS[1]); // Bob: 0 produit lié
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
