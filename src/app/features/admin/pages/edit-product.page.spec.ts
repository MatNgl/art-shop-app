import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';

import { EditProductPage } from './edit-product.page';
import { ProductService } from '../../catalog/services/product';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';
import { Product } from '../../catalog/models/product.model';

describe('Page d’édition de produit (EditProductPage)', () => {
  let component: EditProductPage;

  let productSvc: jasmine.SpyObj<Pick<ProductService, 'getProductById' | 'updateProduct'>>;
  let categorySvc: jasmine.SpyObj<Pick<CategoryService, 'getAll'>>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  const CATEGORIES: Category[] = [
    {
      id: 1,
      name: 'Catégorie A',
      slug: 'cat-a',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Catégorie B',
      slug: 'cat-b',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const PRODUCT: Product = {
    id: 7,
    title: 'Peinture',
    description: 'Une belle peinture',
    price: 120,
    categoryId: 1,
    tags: [],
    imageUrl: '',
    images: [],
    stock: 2,
    technique: 'Acrylique',
    dimensions: { width: 40, height: 50, unit: 'cm' },
    isAvailable: true,
    isLimitedEdition: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setupWithRouteId(idValue: string): void {
    TestBed.resetTestingModule();

    productSvc = jasmine.createSpyObj<Pick<ProductService, 'getProductById' | 'updateProduct'>>(
      'ProductService',
      ['getProductById', 'updateProduct']
    );
    categorySvc = jasmine.createSpyObj<Pick<CategoryService, 'getAll'>>('CategoryService', [
      'getAll',
    ]);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

    // valeurs par défaut pour le chargement des catégories
    categorySvc.getAll.and.resolveTo(CATEGORIES);

    TestBed.configureTestingModule({
      imports: [EditProductPage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productSvc },
        { provide: CategoryService, useValue: categorySvc },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: idValue }) },
          } as ActivatedRoute,
        },
      ],
    });

    const fixture = TestBed.createComponent(EditProductPage);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  it('existe', () => {
    setupWithRouteId('7');
    expect(typeof EditProductPage).toBe('function');
  });

  it('ngOnInit → ID invalide : affiche une erreur puis revient à la liste', async () => {
    setupWithRouteId('not-a-number');

    await component.ngOnInit();

    // catégories sont chargées avant la vérification d’ID
    expect(categorySvc.getAll).toHaveBeenCalled();

    expect(toast.error).toHaveBeenCalledWith('Identifiant invalide.');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
    expect(productSvc.getProductById).not.toHaveBeenCalled();
  });

  it('ngOnInit → produit introuvable : affiche une erreur puis revient à la liste', async () => {
    setupWithRouteId('5');

    productSvc.getProductById.and.resolveTo(null);

    await component.ngOnInit();

    expect(categorySvc.getAll).toHaveBeenCalled();
    expect(productSvc.getProductById).toHaveBeenCalledWith(5);

    expect(toast.error).toHaveBeenCalledWith('Produit introuvable.');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
    expect(component.initial()).toBeNull();
  });

  it('ngOnInit → charge catégories + produit et remplit initial', async () => {
    setupWithRouteId(String(PRODUCT.id));
    productSvc.getProductById.and.resolveTo(PRODUCT);

    await component.ngOnInit();

    expect(categorySvc.getAll).toHaveBeenCalled();
    expect(productSvc.getProductById).toHaveBeenCalledWith(PRODUCT.id);

    expect(component.categories().length).toBe(CATEGORIES.length);
    expect(component.initial()?.id).toBe(PRODUCT.id);
  });

  it('onSave → mise à jour OK : affiche un succès puis revient à la liste', async () => {
    setupWithRouteId(String(PRODUCT.id));
    productSvc.getProductById.and.resolveTo(PRODUCT);
    productSvc.updateProduct.and.resolveTo();

    await component.ngOnInit();

    const payload: Partial<Product> = { title: 'Peinture modifiée', price: 150 };
    await component.onSave(payload);

    expect(productSvc.updateProduct).toHaveBeenCalledWith(PRODUCT.id, payload);
    expect(toast.success).toHaveBeenCalledWith('Modifications enregistrées.');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
  });

  it('onSave → échec de mise à jour : affiche une erreur (pas de navigation)', async () => {
    setupWithRouteId(String(PRODUCT.id));
    productSvc.getProductById.and.resolveTo(PRODUCT);
    productSvc.updateProduct.and.rejectWith(new Error('boom'));

    await component.ngOnInit();

    await component.onSave({ title: 'X' });

    expect(productSvc.updateProduct).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('La mise à jour a échoué.');
    // pas de redirection en cas d’erreur
    expect(router.navigate as jasmine.Spy).not.toHaveBeenCalledWith(['/admin/products']);
  });

  it('onCancel → revient à la liste', () => {
    setupWithRouteId(String(PRODUCT.id));
    component.onCancel();
    expect(router.navigate as jasmine.Spy).toHaveBeenCalledWith(['/admin/products']);
  });
});
