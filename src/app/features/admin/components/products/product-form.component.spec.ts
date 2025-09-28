import { TestBed } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/services/toast.service';
import type { Product, Dimensions } from '../../../catalog/models/product.model';
import type { Category } from '../../../catalog/models/category.model';

type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;

function makeProduct(id: number, title: string, opts?: Partial<Product>): Product {
  const now = new Date();
  return {
    id,
    title,
    description: 'Description courte',
    price: 150,
    tags: [],
    imageUrl: '',
    images: ['https://img/1.jpg', 'https://img/2.jpg'],
    technique: 'Technique',
    dimensions: { width: 20, height: 30, unit: 'cm' } as Dimensions,
    isAvailable: true,
    stock: 3,
    isLimitedEdition: true,
    editionNumber: 1,
    totalEditions: 10,
    createdAt: now,
    updatedAt: now,
    categoryId: 1,
    ...opts,
  } as Product;
}

describe('Page formulaire produit (ProductFormComponent)', () => {
  let toastSpy: jasmine.SpyObj<TToast>;

  beforeEach(async () => {
    toastSpy = jasmine.createSpyObj<TToast>('ToastService', [
      'success',
      'error',
      'info',
      'warning',
    ]);

    await TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule, ProductFormComponent],
      providers: [{ provide: ToastService, useValue: toastSpy }],
    }).compileComponents();
  });

  it('peuple le formulaire depuis `initial` et hydrate les images', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;

    const initial = makeProduct(5, 'Mon œuvre');
    fixture.detectChanges();

    comp.initial = initial;
    comp.ngOnChanges({
      initial: {
        currentValue: initial,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    expect(comp.form.value.title).toBe('Mon œuvre');
    expect(comp.images.length).toBe(2);
    expect(comp.form.value.categoryId).toBe(1);

    // NOTE: formatPreview() n'est pas réactif au formulaire reste '—'
    expect(comp.formatPreview()).toBe('—');
  });

  it('valide: au moins une image requise', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    expect(comp.images.length).toBe(0);
    comp.form.updateValueAndValidity();
    expect(comp.images.invalid).toBeTrue();

    comp.images.push(comp['fb'].nonNullable.control('https://img/x.jpg'));
    comp.form.updateValueAndValidity();
    expect(comp.images.valid).toBeTrue();
  });

  it('valide: originalPrice >= price quand défini', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    comp.form.patchValue({ price: 100, originalPrice: 90 });
    comp.form.updateValueAndValidity();
    expect(comp.form.hasError('originalLtPrice')).toBeTrue();

    comp.form.patchValue({ originalPrice: 120 });
    comp.form.updateValueAndValidity();
    expect(comp.form.hasError('originalLtPrice')).toBeFalse();
  });

  it('valide édition limitée: 1 ≤ numéro ≤ total quand isLimitedEdition', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    comp.form.patchValue({ isLimitedEdition: true, editionNumber: 5, totalEditions: 4 });
    comp.form.updateValueAndValidity();
    expect(comp.form.hasError('limitedRange')).toBeTrue();

    comp.form.patchValue({ editionNumber: 3, totalEditions: 4 });
    comp.form.updateValueAndValidity();
    expect(comp.form.hasError('limitedRange')).toBeFalse();
  });

  it('submit invalide: affiche un message et n’émet pas', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    const emitSpy = spyOn(comp.save, 'emit');
    comp.onSubmit();
    expect(toastSpy.info).toHaveBeenCalledWith('Veuillez corriger les erreurs du formulaire.');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('submit valide: émet un payload assaini et notifie le succès', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    comp.images.push(comp['fb'].nonNullable.control('https://img/cover.jpg'));

    comp.form.patchValue({
      title: 'Titre',
      categoryId: 1,
      price: 123.45,
      originalPrice: 150,
      stock: 2,
      isAvailable: true,
      isLimitedEdition: true,
      editionNumber: 2,
      totalEditions: 10,
      description: 'Texte',
      dimensions: { width: 12, height: 34, unit: 'cm' },
    });

    const emitSpy = spyOn(comp.save, 'emit');
    comp.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Titre',
        categoryId: 1,
        price: 123.45,
        originalPrice: 150,
        stock: 2,
        isAvailable: true,
        isLimitedEdition: true,
        editionNumber: 2,
        totalEditions: 10,
        imageUrl: 'https://img/cover.jpg',
        images: ['https://img/cover.jpg'],
        dimensions: { width: 12, height: 34, unit: 'cm' } as Dimensions,
        description: 'Texte',
      })
    );
    expect(toastSpy.success).toHaveBeenCalledWith('Produit enregistré avec succès.');
  });

  it('addImageByUrl: ajoute une image quand l’URL est valide (http ou data:)', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    const promptSpy = spyOn(window, 'prompt').and.returnValue('https://img/ok.jpg');
    comp.addImageByUrl();
    expect(promptSpy).toHaveBeenCalled();
    expect(comp.images.length).toBe(1);

    (window.prompt as jasmine.Spy).and.returnValue('data:image/png;base64,AAA');
    comp.addImageByUrl();
    expect(comp.images.length).toBe(2);

    (window.prompt as jasmine.Spy).and.returnValue('notaurl');
    comp.addImageByUrl();
    expect(comp.images.length).toBe(2); // inchangé
  });

  it('removeImage: supprime une image et met à jour la validité', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const comp = fixture.componentInstance;
    const categories: Category[] = [
      {
        id: 1,
        name: 'Cat',
        slug: 'cat',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    comp.categories = categories;
    fixture.detectChanges();

    comp.images.push(comp['fb'].nonNullable.control('a'));
    comp.images.push(comp['fb'].nonNullable.control('b'));
    comp.form.updateValueAndValidity();
    expect(comp.images.valid).toBeTrue();

    comp.removeImage(0);
    comp.form.updateValueAndValidity();
    expect(comp.images.length).toBe(1);
    expect(comp.images.valid).toBeTrue();
  });
});
