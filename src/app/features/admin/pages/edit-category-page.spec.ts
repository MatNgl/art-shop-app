import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { EditCategoryPage } from './edit-category-page';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';

describe('EditCategoryPage', () => {
    let component: EditCategoryPage;

    let catSvc: jasmine.SpyObj<Pick<CategoryService, 'getById' | 'update'>>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    const CAT: Category = {
        id: 7,
        name: 'Peinture',
        slug: 'peinture',
        isActive: true,
        productIds: [],
        description: 'desc',
        color: '#000',
        icon: 'fa-brush',
        image: 'http://img',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    function setupWithRouteId(idValue: string) {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [EditCategoryPage, RouterTestingModule],
            providers: [
                { provide: CategoryService, useValue: catSvc },
                { provide: ToastService, useValue: toast },
                {
                    // 🔧 IMPORTANT: on fournit le *vrai* token ActivatedRoute
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: convertToParamMap({ id: idValue }) },
                    },
                },
            ],
        });
        const fixture = TestBed.createComponent(EditCategoryPage);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        // on spy ici UNE FOIS par setup
        spyOn(router, 'navigate').and.resolveTo(true);
    }

    beforeEach(() => {
        catSvc = jasmine.createSpyObj<Pick<CategoryService, 'getById' | 'update'>>(
            'CategoryService',
            ['getById', 'update']
        );
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
    });

    it('is defined', () => expect(typeof EditCategoryPage).toBe('function'));

    it('ngOnInit → ID invalide : toast.error + navigate liste', async () => {
        setupWithRouteId('not-a-number');

        await component.ngOnInit();

        expect(toast.error).toHaveBeenCalledWith('Identifiant invalide.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
        expect(catSvc.getById).not.toHaveBeenCalled();
    });

    it('ngOnInit → catégorie introuvable : toast.error + navigate liste', async () => {
        setupWithRouteId('5');
        catSvc.getById.and.resolveTo(null);

        await component.ngOnInit();

        expect(catSvc.getById).toHaveBeenCalledWith(5);
        expect(toast.error).toHaveBeenCalledWith('Catégorie introuvable.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('ngOnInit → charge la catégorie et remplit initial', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);

        await component.ngOnInit();

        expect(catSvc.getById).toHaveBeenCalledWith(CAT.id);
        expect(component.initial()?.id).toBe(CAT.id);
    });

    it('onSave → update OK : toast.success + navigate', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);
        catSvc.update.and.resolveTo();

        await component.ngOnInit();

        const patch: Partial<Category> = {
            name: 'Peinture modifiée',
            slug: 'peinture-mod',
            isActive: false,
            productIds: [],
        };

        await component.onSave(patch);

        expect(catSvc.update).toHaveBeenCalledWith(
            CAT.id,
            jasmine.objectContaining({
                name: 'Peinture modifiée',
                slug: 'peinture-mod',
                isActive: false,
                productIds: [],
            })
        );
        expect(toast.success).toHaveBeenCalledWith('Modifications enregistrées.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('onSave → update KO : toast.error', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);
        catSvc.update.and.rejectWith(new Error('boom'));

        await component.ngOnInit();
        await component.onSave({ name: 'X', slug: 'x' });

        expect(catSvc.update).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('La mise à jour a échoué.');
    });

    it('onCancel → navigate liste', () => {
        setupWithRouteId(String(CAT.id));
        // pas de re-spy ici (il l’est déjà dans setup)
        component.onCancel();
        expect((router.navigate as jasmine.Spy)).toHaveBeenCalledWith(['/admin/categories']);
    });
});
