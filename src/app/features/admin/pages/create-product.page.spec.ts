// src/app/features/admin/pages/create-product.page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { CreateProductPage } from './create-product.page';
import { ProductService } from '../../catalog/services/product';
import { ArtistService } from '../../catalog/services/artist';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';

import { Product, Artist } from '../../catalog/models/product.model';

// ------- Mocks typés (ids en number) ----------------------------------------

const ARTISTS_MOCK: Artist[] = [
    { id: 1, name: 'Artist 1' },
    { id: 2, name: 'Artist 2' },
];

const CATEGORIES_MOCK: Category[] = [
    {
        id: 1,
        name: 'Category 1',
        slug: 'category-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'Category 2',
        slug: 'category-2',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const PRODUCT_RESULT_MOCK: Product = {
    id: 101,
    title: 'New Product',
    description: 'Default Description',
    price: 99,
    artistId: 1,
    categoryId: 1,
    tags: [],
    imageUrl: '',
    images: [],
    stock: 0,
    // Champs requis par l'interface Product :
    technique: 'Technique',
    dimensions: { width: 0, height: 0, unit: 'cm' },
    isAvailable: true,
    isLimitedEdition: false,
    // (si ton modèle impose editionNumber/totalEditions, ajoute-les ici)
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('CreateProductPage', () => {
    let fixture: ComponentFixture<CreateProductPage>;
    let component: CreateProductPage;

    let productSvc: jasmine.SpyObj<ProductService>;
    let artistSvc: jasmine.SpyObj<ArtistService>;
    let categorySvc: jasmine.SpyObj<CategoryService>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    beforeEach(async () => {
        productSvc = jasmine.createSpyObj<ProductService>('ProductService', ['createProduct']);
        artistSvc = jasmine.createSpyObj<ArtistService>('ArtistService', ['getAll']);
        categorySvc = jasmine.createSpyObj<CategoryService>('CategoryService', ['getAll']);
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'warning', 'error']);

        artistSvc.getAll.and.resolveTo(ARTISTS_MOCK);
        categorySvc.getAll.and.resolveTo(CATEGORIES_MOCK);

        await TestBed.configureTestingModule({
            imports: [CreateProductPage, RouterTestingModule],
            providers: [
                provideRouter([]),
                { provide: ProductService, useValue: productSvc },
                { provide: ArtistService, useValue: artistSvc },
                { provide: CategoryService, useValue: categorySvc },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(CreateProductPage);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('loads artists and categories on init', async () => {
        await component.ngOnInit();
        expect(artistSvc.getAll).toHaveBeenCalled();
        expect(categorySvc.getAll).toHaveBeenCalled();
        expect(component.artists().length).toBe(2);
        expect(component.categories().length).toBe(2);
    });

    it('onSave: calls createProduct, shows success and navigates on success', async () => {
        const payload: Partial<Product> = {
            title: 'New Product',
            price: 99,
            artistId: 1,     // ← number
            categoryId: 1,   // ← number
        };

        productSvc.createProduct.and.resolveTo(PRODUCT_RESULT_MOCK);

        await component.onSave(payload);

        expect(productSvc.createProduct).toHaveBeenCalledWith({
            // le composant envoie un Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
            title: 'New Product',
            price: 99,
            artistId: 1,
            categoryId: 1,
        } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);

        expect(toast.success).toHaveBeenCalledWith('Produit créé.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
    });

    it('onSave: shows error toast on failure', async () => {
        const payload: Partial<Product> = {
            title: 'New Product',
            price: 99,
            artistId: 1,   // ← number
            categoryId: 1, // ← number
        };

        productSvc.createProduct.and.rejectWith(new Error('fail'));

        await component.onSave(payload);

        expect(productSvc.createProduct).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('La création a échoué.');
    });

    it('onCancel: navigates back to list', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
    });
});
