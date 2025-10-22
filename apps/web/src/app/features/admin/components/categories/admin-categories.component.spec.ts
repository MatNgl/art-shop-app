import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AdminCategoriesComponent } from './admin-categories.component';
import { AuthService } from '../../../auth/services/auth';
import { CategoryService, Category } from '../../../catalog/services/category';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { User, UserRole } from '../../../auth/models/user.model';

describe('Page Admin – Catégories (AdminCategoriesComponent)', () => {
    let fixture: ComponentFixture<AdminCategoriesComponent>;
    let component: AdminCategoriesComponent;
    let router: Router;

    // Spies stricts
    let auth: jasmine.SpyObj<Pick<AuthService, 'getCurrentUser'>>;
    let catSvc: jasmine.SpyObj<Pick<CategoryService, 'getAll' | 'update' | 'remove'>>;
    let prodSvc: jasmine.SpyObj<Pick<ProductService, 'getAll'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;
    let confirm: jasmine.SpyObj<Pick<ConfirmService, 'ask'>>;

    const ADMIN: User = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Root',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
    };

    const CATS: Category[] = [
        { id: 10, name: 'Peinture', slug: 'peinture', isActive: true, productIds: [101, 102, 103], createdAt: '2024-01-10', updatedAt: '2024-01-10' },
        { id: 11, name: 'Sculpture', slug: 'sculpture', isActive: false, productIds: [103], createdAt: '2024-01-11', updatedAt: '2024-01-11' },
    ];

    const PRODS: Product[] = [
        // Divers schémas d’assignation de catégories
        { id: 100, title: 'P1' } as Product,
        { id: 101, title: 'P2', categoryId: 10 } as unknown as Product,
        { id: 102, title: 'P3', category: { id: 10 } } as unknown as Product,
        { id: 103, title: 'P4', categoryIds: [11, 10] } as unknown as Product,
    ];

    beforeEach(async () => {
        auth = jasmine.createSpyObj<Pick<AuthService, 'getCurrentUser'>>('AuthService', ['getCurrentUser']);
        catSvc = jasmine.createSpyObj<Pick<CategoryService, 'getAll' | 'update' | 'remove'>>('CategoryService', ['getAll', 'update', 'remove']);
        prodSvc = jasmine.createSpyObj<Pick<ProductService, 'getAll'>>('ProductService', ['getAll']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error'>>('ToastService', ['success', 'error']);
        confirm = jasmine.createSpyObj<Pick<ConfirmService, 'ask'>>('ConfirmService', ['ask']);

        await TestBed.configureTestingModule({
            imports: [AdminCategoriesComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: auth },
                { provide: CategoryService, useValue: catSvc },
                { provide: ProductService, useValue: prodSvc },
                { provide: ToastService, useValue: toast },
                { provide: ConfirmService, useValue: confirm },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(AdminCategoriesComponent);
        component = fixture.componentInstance;
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it("ngOnInit → non admin → redirige vers '/' et ne charge pas", async () => {
        auth.getCurrentUser.and.returnValue(null);

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(catSvc.getAll).not.toHaveBeenCalled();
        expect(prodSvc.getAll).not.toHaveBeenCalled();
    });

    it('ngOnInit → charge catégories + produits et met fin au loading', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);

        await component.ngOnInit();

        expect(catSvc.getAll).toHaveBeenCalled();
        expect(prodSvc.getAll).toHaveBeenCalled();
        expect(component.categories()).toEqual(CATS);
        expect(component['products']()).toEqual(PRODS);
        expect(component.loading()).toBeFalse();

        // Vérifie le comptage produit (via extractCategoryIds)
        expect(component.productCount(10)).toBe(3); // P2, P3, P4
        expect(component.productCount(11)).toBe(1); // P4
    });

    it("loadData → en cas d'erreur → toast.error + loading=false", async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.rejectWith(new Error('boom'));
        prodSvc.getAll.and.resolveTo(PRODS);

        await component.ngOnInit();

        expect(toast.error).toHaveBeenCalledWith('Impossible de charger les catégories.');
        expect(component.loading()).toBeFalse();
    });

    it("refreshData → recharge et affiche 'Catégories actualisées'", async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);

        await component.ngOnInit();
        toast.success.calls.reset();
        catSvc.getAll.calls.reset();
        prodSvc.getAll.calls.reset();

        await component.refreshData();

        expect(catSvc.getAll).toHaveBeenCalled();
        expect(prodSvc.getAll).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Catégories actualisées');
    });

    it('createCategory → navigue vers la page de création', () => {
        component.createCategory();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories/new']);
    });

    it('editCategory → navigue vers la page édition de la catégorie', () => {
        const cat = CATS[0];
        component.editCategory(cat);
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories', cat.id, 'edit']);
    });

    it('toggleActive → confirme, met à jour isActive et recharge + toast succès', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);

        await component.ngOnInit();

        const cat = CATS[1]; // inactive → passe à active
        confirm.ask.and.resolveTo(true);
        catSvc.update.and.resolveTo();

        catSvc.getAll.calls.reset();
        prodSvc.getAll.calls.reset();

        await component.toggleActive(cat);

        expect(confirm.ask).toHaveBeenCalled();
        expect(catSvc.update).toHaveBeenCalledOnceWith(cat.id, { isActive: true });
        // reload
        expect(catSvc.getAll).toHaveBeenCalled();
        expect(prodSvc.getAll).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Catégorie activée.');
    });

    it('toggleActive → annule la confirmation → ne fait rien', async () => {
        const cat = CATS[0];
        confirm.ask.and.resolveTo(false);

        await component.toggleActive(cat);

        expect(catSvc.update).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('toggleActive → erreur service → toast.error', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);
        await component.ngOnInit();

        const cat = CATS[0];
        confirm.ask.and.resolveTo(true);
        catSvc.update.and.rejectWith(new Error('fail'));

        await component.toggleActive(cat);

        expect(toast.error).toHaveBeenCalledWith('La mise à jour a échoué.');
    });

    it('deleteCategory → confirme, supprime, recharge et toast succès', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);
        await component.ngOnInit();

        const cat = CATS[0];
        confirm.ask.and.resolveTo(true);
        catSvc.remove.and.resolveTo();

        catSvc.getAll.calls.reset();
        prodSvc.getAll.calls.reset();

        await component.deleteCategory(cat);

        expect(confirm.ask).toHaveBeenCalled();
        expect(catSvc.remove).toHaveBeenCalledOnceWith(cat.id);
        expect(catSvc.getAll).toHaveBeenCalled();
        expect(prodSvc.getAll).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Catégorie supprimée.');
    });

    it('deleteCategory → annule la confirmation → ne fait rien', async () => {
        const cat = CATS[1];
        confirm.ask.and.resolveTo(false);

        await component.deleteCategory(cat);

        expect(catSvc.remove).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('deleteCategory → erreur service → toast.error', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        catSvc.getAll.and.resolveTo(CATS);
        prodSvc.getAll.and.resolveTo(PRODS);
        await component.ngOnInit();

        const cat = CATS[1];
        confirm.ask.and.resolveTo(true);
        catSvc.remove.and.rejectWith(new Error('nope'));

        await component.deleteCategory(cat);

        expect(toast.error).toHaveBeenCalledWith('La suppression a échoué.');
    });
});
