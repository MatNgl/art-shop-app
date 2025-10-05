import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { EditCategoryPage } from './edit-category-page';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';
import { CategorySavePayload } from '../components/categories/category-form.component';

describe('Page d’édition de catégorie (EditCategoryPage)', () => {
    let component: EditCategoryPage;
    let catSvc: jasmine.SpyObj<Pick<CategoryService, 'getById' | 'update'>>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    // Exemple de catégorie pour les tests
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

    /**
     * Instancie le composant avec un ActivatedRoute configuré
     * pour simuler un paramètre `id` dans l’URL.
     */
    function setupWithRouteId(idValue: string) {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [EditCategoryPage, RouterTestingModule],
            providers: [
                { provide: CategoryService, useValue: catSvc },
                { provide: ToastService, useValue: toast },
                {
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
        spyOn(router, 'navigate').and.resolveTo(true);
    }

    beforeEach(() => {
        catSvc = jasmine.createSpyObj<Pick<CategoryService, 'getById' | 'update'>>(
            'CategoryService',
            ['getById', 'update']
        );
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
    });

    it('se crée correctement', () => {
        expect(typeof EditCategoryPage).toBe('function');
    });

    it('ngOnInit → ID invalide → affiche une erreur et redirige vers la liste', async () => {
        setupWithRouteId('not-a-number');

        await component.ngOnInit();

        expect(toast.error).toHaveBeenCalledWith('Identifiant invalide.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
        expect(catSvc.getById).not.toHaveBeenCalled();
    });

    it('ngOnInit → catégorie introuvable → affiche une erreur et redirige vers la liste', async () => {
        setupWithRouteId('5');
        catSvc.getById.and.resolveTo(null);

        await component.ngOnInit();

        expect(catSvc.getById).toHaveBeenCalledWith(5);
        expect(toast.error).toHaveBeenCalledWith('Catégorie introuvable.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('ngOnInit → catégorie trouvée → charge les données initiales', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);

        await component.ngOnInit();

        expect(catSvc.getById).toHaveBeenCalledWith(CAT.id);
        expect(component.initial()?.id).toBe(CAT.id);
    });

    it('onSave → mise à jour réussie → affiche un succès et redirige', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);
        catSvc.update.and.resolveTo();

        await component.ngOnInit();

        const payload: CategorySavePayload = {
            category: {
                name: 'Peinture modifiée',
                slug: 'peinture-mod',
                isActive: false,
            },
            subCategories: { toCreate: [], toUpdate: [], toDeleteIds: [] }
        };

        await component.onSave(payload);

        expect(catSvc.update).toHaveBeenCalledWith(
            CAT.id,
            jasmine.objectContaining({
                name: 'Peinture modifiée',
                slug: 'peinture-mod',
                isActive: false,
            })
        );
        expect(toast.success).toHaveBeenCalledWith('Modifications enregistrées.');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/categories']);
    });

    it('onSave → mise à jour échoue → affiche une erreur', async () => {
        setupWithRouteId(String(CAT.id));
        catSvc.getById.and.resolveTo(CAT);
        catSvc.update.and.rejectWith(new Error('boom'));

        await component.ngOnInit();

        const payload: CategorySavePayload = {
            category: { name: 'X', slug: 'x' },
            subCategories: { toCreate: [], toUpdate: [], toDeleteIds: [] }
        };
        await component.onSave(payload);

        expect(catSvc.update).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('La mise à jour a échoué.');
    });

    it('onCancel → redirige vers la liste', () => {
        setupWithRouteId(String(CAT.id));

        component.onCancel();

        expect((router.navigate as jasmine.Spy)).toHaveBeenCalledWith(['/admin/categories']);
    });
});
