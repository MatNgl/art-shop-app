// src/app/features/admin/pages/create-category-page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { CreateCategoryPage } from './create-category-page'; // ← vérifie le nom/chemin exact du composant
import { CategoryService } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';
import { Category } from '../../catalog/services/category';

interface CategoryCreatePayload {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    image?: string;
    isActive?: boolean;
}

describe('CreateCategoryPage', () => {
    let fixture: ComponentFixture<CreateCategoryPage>;
    let component: CreateCategoryPage;
    let categorySvc: jasmine.SpyObj<CategoryService>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    beforeEach(async () => {
        categorySvc = jasmine.createSpyObj<CategoryService>('CategoryService', ['create']);
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [CreateCategoryPage, RouterTestingModule],
            providers: [
                provideRouter([]),
                { provide: CategoryService, useValue: categorySvc },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(CreateCategoryPage);
        component = fixture.componentInstance;
        // avoid running change detection immediately to prevent template-driven ngModel
        // interactions from child components during setup (they can cause NG01350 in tests)
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onSave: calls service, shows success, navigates on success', async () => {
        categorySvc.create.and.callFake(
            async (
                data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>
            ): Promise<Category> => ({
                id: 1,
                productIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...data,
                isActive: data.isActive ?? true
            })
        );


        const payload: CategoryCreatePayload = { name: 'Paysage', slug: 'paysage', isActive: true };
        await component.onSave(payload);

        expect(categorySvc.create).toHaveBeenCalledWith(jasmine.objectContaining(payload));
        expect(toast.success).toHaveBeenCalledWith('Catégorie créée.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('onSave: shows error toast on failure', async () => {
        categorySvc.create.and.callFake(async () => { throw new Error('fail'); });

        const payload: CategoryCreatePayload = { name: 'Portrait', slug: 'portrait' };
        await component.onSave(payload);

        expect(categorySvc.create).toHaveBeenCalled();
        // message d'erreur renvoyé par le composant
        expect(toast.error).toHaveBeenCalledWith('La création a échoué.');
    });

    it('onCancel: navigates back to list', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });
});
