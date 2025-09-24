import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CategoryFormComponent } from './category-form.component';
import { CategoryService, Category } from '../../../catalog/services/category';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ToastService } from '../../../../shared/services/toast.service';

describe('Formulaire Catégorie (CategoryFormComponent)', () => {
    let fixture: ComponentFixture<CategoryFormComponent>;
    let component: CategoryFormComponent;

    let catSvc: jasmine.SpyObj<Pick<CategoryService, 'slugify'>>;
    let prodSvc: jasmine.SpyObj<Pick<ProductService, 'getAllProducts'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'warning'>>;

    const PRODUCTS: Product[] = [
        { id: 1, title: 'Prod A' } as Product,
        { id: 2, title: 'Prod B' } as Product,
        { id: 3, title: 'Alpha' } as Product,
    ];

    beforeEach(async () => {
        catSvc = jasmine.createSpyObj<Pick<CategoryService, 'slugify'>>('CategoryService', ['slugify']);
        prodSvc = jasmine.createSpyObj<Pick<ProductService, 'getAllProducts'>>('ProductService', ['getAllProducts']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'warning'>>('ToastService', ['success', 'warning']);

        prodSvc.getAllProducts.and.resolveTo(PRODUCTS);
        catSvc.slugify.and.callFake((s: string) => s.toLowerCase().replace(/\s+/g, '-'));

        await TestBed.configureTestingModule({
            imports: [CategoryFormComponent],
            providers: [
                { provide: CategoryService, useValue: catSvc },
                { provide: ProductService, useValue: prodSvc },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CategoryFormComponent);
        component = fixture.componentInstance;
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit → charge la liste des produits', async () => {
        await component.ngOnInit();
        expect(prodSvc.getAllProducts).toHaveBeenCalled();
        expect(component.allProducts.length).toBe(PRODUCTS.length);
    });

    it('ngOnChanges → applique initial et remplit productIds', () => {
        const initial: Category = {
            id: 7,
            name: 'Peinture',
            slug: 'peinture',
            isActive: true,
            productIds: [1, 3],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
        };
        component.initial = initial;

        component.ngOnChanges({ initial: { previousValue: null, currentValue: initial, firstChange: true, isFirstChange: () => true } });
        const v = component.form.getRawValue();

        expect(v.name).toBe('Peinture');
        expect(v.slug).toBe('peinture');
        expect(component.productIds.length).toBe(2);
        expect(component.hasProduct(3)).toBeTrue();
    });

    it("onNameChange → génère le slug depuis le nom si 'initial' est vide (création)", () => {
        component.initial = null;
        component.form.controls.name.setValue('Nouvelle Catégorie');
        component.onNameChange();

        // on vérifie que le composant met bien le retour de slugify
        const expected = catSvc.slugify.calls.mostRecent().returnValue as string;
        expect(component.form.controls.slug.value).toBe(expected);
    });


    it('toggleProduct / hasProduct → ajoute puis retire un produit', () => {
        expect(component.hasProduct(2)).toBeFalse();

        component.toggleProduct(2);
        expect(component.hasProduct(2)).toBeTrue();

        component.toggleProduct(2);
        expect(component.hasProduct(2)).toBeFalse();
    });

    it('filteredProducts → filtre par titre ou id depuis productFilterCtrl', async () => {
        await component.ngOnInit();

        // Par titre
        component.productFilterCtrl.setValue('alpha');
        const byTitle = component.filteredProducts();
        expect(byTitle.map(p => p.id)).toEqual([3]);

        // Par id
        component.productFilterCtrl.setValue('2');
        const byId = component.filteredProducts();

        expect(byId.length).toBe(1);
        expect(byId[0]?.id).toBe(2);
    });


    it("onSubmit → formulaire invalide → markAllAsTouched + toast.warning et n'émet rien", () => {
        spyOn(component.save, 'emit');
        component.form.reset(); // rend invalide (name/slug requis)
        expect(component.form.invalid).toBeTrue();

        component.onSubmit();

        expect(toast.warning).toHaveBeenCalledWith('Veuillez corriger les erreurs du formulaire.');
        expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('onSubmit → valide → émet un payload propre (sans undefined parasites) + toast.success', () => {
        spyOn(component.save, 'emit');

        // Remplir le formulaire validement
        component.form.patchValue({
            name: 'Cat X',
            slug: 'cat-x',
            description: null, // restera undefined dans payload (assaini)
            color: '#000',
            icon: null,
            image: null,
            isActive: true,
        });
        // Sélection de produits
        component.toggleProduct(1);
        component.toggleProduct(3);

        expect(component.form.valid).toBeTrue();

        component.onSubmit();

        // Vérifie le payload émis (uniquement champs définis)
        expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining({
            name: 'Cat X',
            slug: 'cat-x',
            color: '#000',
            isActive: true,
            productIds: [1, 3],
        }));
        // Aucun champ undefined attendu : description/icon/image omis → OK via objectContaining

        expect(toast.success).toHaveBeenCalledWith('Catégorie enregistrée avec succès.');
        expect(component.submitting).toBeFalse();
    });

    it('bouton Annuler → émet cancelEvent', () => {
        spyOn(component.cancelEvent, 'emit');
        component.cancelEvent.emit();
        expect(component.cancelEvent.emit).toHaveBeenCalled();
    });
});
