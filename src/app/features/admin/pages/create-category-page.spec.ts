import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { CreateCategoryPage } from './create-category-page';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';

import { CategorySavePayload } from '../components/categories/category-form.component';

describe('Page de création de catégorie (CreateCategoryPage)', () => {
    let fixture: ComponentFixture<CreateCategoryPage>;
    let component: CreateCategoryPage;

    let categorySvc: jasmine.SpyObj<Pick<CategoryService, 'create'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;
    let router: Router;

    beforeEach(async () => {
        categorySvc = jasmine.createSpyObj<Pick<CategoryService, 'create'>>(
            'CategoryService',
            ['create']
        );
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error'>>('ToastService', [
            'success',
            'error',
        ]);

        await TestBed.configureTestingModule({
            imports: [CreateCategoryPage],
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
        // Pas de detectChanges : on cible la logique TypeScript
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('enregistre → succès : appelle le service, affiche un succès et revient à la liste', async () => {
        categorySvc.create.and.callFake(
            async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>) =>
                ({
                    id: 1,
                    productIds: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...data,
                    isActive: data.isActive ?? true,
                }) as Category
        );

        const payload: CategorySavePayload = {
            category: { name: 'Paysage', slug: 'paysage', isActive: true },
            subCategories: { toCreate: [], toUpdate: [], toDeleteIds: [] }
        };
        await component.onSave(payload);

        expect(categorySvc.create).toHaveBeenCalledWith(jasmine.objectContaining(payload.category));
        expect(toast.success).toHaveBeenCalledWith('Catégorie créée.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('enregistre → échec : affiche une erreur', async () => {
        categorySvc.create.and.rejectWith(new Error('fail'));

        const payload: CategorySavePayload = {
            category: { name: 'Portrait', slug: 'portrait' },
            subCategories: { toCreate: [], toUpdate: [], toDeleteIds: [] }
        };
        await component.onSave(payload);

        expect(categorySvc.create).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('La création a échoué.');
    });

    it('annuler : retourne à la liste', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });
});
