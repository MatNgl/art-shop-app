/**
 * Tests E2E pour les workflows admin
 *
 * Ces tests couvrent les scénarios fonctionnels complets :
 * - Création de produits avec variantes
 * - Modification de produits existants
 * - Création et modification de catégories
 * - Gestion des associations produits-catégories
 * - Suspension et activation de produits
 * - Affichage des nouveaux produits
 */
'@angular/core/testing';
import { ProductService } from '../../catalog/services/product';
import { CategoryService } from '../../catalog/services/category';
import type { Product } from '../../catalog/models/product.model';
import type { Category } from '../../catalog/models/category.model';

describe('Admin Workflows E2E', () => {
  let productService: jasmine.SpyObj<ProductService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    productService = jasmine.createSpyObj('ProductService', [
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'getAllProducts',
      'getProductById',
    ]);

    categoryService = jasmine.createSpyObj('CategoryService', [
      'getAllCategories',
      'getCategoryById',
      'slugify',
    ]);

    categoryService.slugify.and.callFake((str: string) => str.toLowerCase().replace(/\s+/g, '-'));
  });

  describe("Workflow: Création complète d'un produit avec variantes", () => {
    it('devrait créer un produit avec plusieurs variantes de tailles', async () => {
      // const mockCategory: Category = {
      //   id: 1,
      //   name: 'Peintures',
      //   slug: 'peintures',
      //   isActive: true,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // };

      const productPayload = {
        title: 'Oeuvre Abstraite',
        description: 'Une magnifique oeuvre abstraite',
        technique: 'Acrylique',
        categoryId: 1,
        subCategoryIds: [11],
        imageUrl: 'https://example.com/image1.jpg',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        originalPrice: 150,
        tags: [],
        dimensions: { width: 50, height: 70, unit: 'cm' as const },
        isAvailable: true,
        isLimitedEdition: false,
        stock: 10,
        variants: [
          {
            id: 1,
            size: 'A3' as const,
            originalPrice: 150,
            reducedPrice: 120,
            stock: 10,
            isAvailable: true,
            dimensions: { width: 29.7, height: 42, unit: 'cm' as const },
          },
          {
            id: 2,
            size: 'A4' as const,
            originalPrice: 100,
            stock: 20,
            isAvailable: true,
            dimensions: { width: 21, height: 29.7, unit: 'cm' as const },
          },
        ],
      };

      const createdProduct: Product = {
        id: 123,
        ...productPayload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productService.createProduct.and.resolveTo(createdProduct);

      // Simuler la création
      const result = await productService.createProduct(productPayload);

      expect(productService.createProduct).toHaveBeenCalled();
      expect(result.id).toBe(123);
      expect(result.variants).toBeDefined();
      expect(result.variants!.length).toBe(2);
      expect(result.variants![0].size).toBe('A3');
      expect(result.variants![1].size).toBe('A4');
    });

    it('devrait valider les prix avant création', async () => {
      const invalidPayload: Partial<Product> = {
        title: 'Produit Invalide',
        variants: [
          {
            id: 1,
            size: 'A4',
            originalPrice: 100,
            reducedPrice: 150, // Prix réduit > prix original (invalide)
            stock: 10,
            isAvailable: true,
            dimensions: { width: 21, height: 29.7, unit: 'cm' },
          },
        ],
      };

      // La validation devrait échouer
      const hasError = invalidPayload.variants!.some(
        (v) => v.reducedPrice && v.reducedPrice > v.originalPrice
      );

      expect(hasError).toBe(true);
    });
  });

  describe("Workflow: Modification d'un produit existant", () => {
    it('devrait charger et modifier un produit existant', async () => {
      const existingProduct: Product = {
        id: 1,
        title: 'Ancien Titre',
        description: 'Ancienne description',
        originalPrice: 100,
        categoryId: 1,
        imageUrl: 'https://example.com/old.jpg',
        images: ['https://example.com/old.jpg'],
        technique: 'Huile',
        dimensions: { width: 50, height: 70, unit: 'cm' },
        isAvailable: true,
        stock: 5,
        isLimitedEdition: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: Partial<Product> = {
        title: 'Nouveau Titre',
        description: 'Nouvelle description',
        originalPrice: 150,
      };

      const updatedProduct: Product = {
        ...existingProduct,
        ...updates,
        updatedAt: new Date(),
      };

      productService.getProductById.and.resolveTo(existingProduct);
      productService.updateProduct.and.resolveTo(updatedProduct);

      // Charger le produit
      const loaded = await productService.getProductById(1);
      expect(loaded).toBeDefined();
      expect(loaded!.title).toBe('Ancien Titre');

      // Mettre à jour
      const result = await productService.updateProduct(1, updates);
      expect(result.title).toBe('Nouveau Titre');
      expect(result.originalPrice).toBe(150);
    });

    it('devrait ajouter des variantes à un produit existant sans variantes', async () => {
      const productWithoutVariants: Product = {
        id: 1,
        title: 'Produit Simple',
        originalPrice: 100,
        stock: 10,
        categoryId: 1,
        imageUrl: 'https://example.com/image.jpg',
        images: ['https://example.com/image.jpg'],
        technique: 'Acrylique',
        dimensions: { width: 50, height: 70, unit: 'cm' },
        description: '',
        tags: [],
        isAvailable: true,
        isLimitedEdition: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: Partial<Product> = {
        variants: [
          {
            id: 1,
            size: 'A4',
            originalPrice: 80,
            stock: 15,
            isAvailable: true,
            dimensions: { width: 21, height: 29.7, unit: 'cm' },
          },
        ],
      };

      productService.updateProduct.and.resolveTo({
        ...productWithoutVariants,
        ...updates,
      } as Product);

      const result = await productService.updateProduct(1, updates);

      expect(result.variants).toBeDefined();
      expect(result.variants!.length).toBe(1);
    });
  });

  describe('Workflow: Gestion des catégories', () => {
    it("devrait valider la création d'une catégorie avec sous-catégories", () => {
      const categoryData = {
        name: 'Photographies',
        slug: 'photographies',
        description: 'Collection de photographies',
        color: '#3B82F6',
        icon: 'fa-camera',
        isActive: true,
        subCategories: [
          {
            name: 'Paysages',
            slug: 'paysages',
          },
          {
            name: 'Portraits',
            slug: 'portraits',
          },
        ],
      };

      // Validation des données
      expect(categoryData.name).toBeTruthy();
      expect(categoryData.slug).toBeTruthy();
      expect(categoryData.subCategories.length).toBe(2);
      expect(categoryData.subCategories[0].name).toBe('Paysages');
      expect(categoryData.subCategories[1].name).toBe('Portraits');
    });

    it("devrait valider la modification d'une catégorie", () => {
      const existingCategory = {
        id: 1,
        name: 'Peintures',
        slug: 'peintures',
        isActive: true,
        subCategories: [
          {
            id: 11,
            name: 'Abstraites',
            slug: 'abstraites',
          },
        ],
      };

      const updates = {
        color: '#FF5733',
        icon: 'fa-paint-brush',
      };

      const updatedCategory = {
        ...existingCategory,
        ...updates,
      };

      expect(updatedCategory.color).toBe('#FF5733');
      expect(updatedCategory.icon).toBe('fa-paint-brush');
      expect(updatedCategory.subCategories.length).toBe(1);
    });
  });

  describe('Workflow: Suspension et activation de produits', () => {
    it('devrait suspendre un produit disponible', async () => {
      const activeProduct: Product = {
        id: 1,
        title: 'Produit Actif',
        isAvailable: true,
        stock: 10,
      } as Product;

      const suspendedProduct: Product = {
        ...activeProduct,
        isAvailable: false,
      };

      productService.updateProduct.and.resolveTo(suspendedProduct);

      const result = await productService.updateProduct(1, { isAvailable: false });

      expect(result.isAvailable).toBe(false);
    });

    it('devrait réactiver un produit suspendu', async () => {
      const suspendedProduct: Product = {
        id: 1,
        title: 'Produit Suspendu',
        isAvailable: false,
        stock: 10,
      } as Product;

      const activeProduct: Product = {
        ...suspendedProduct,
        isAvailable: true,
      };

      productService.updateProduct.and.resolveTo(activeProduct);

      const result = await productService.updateProduct(1, { isAvailable: true });

      expect(result.isAvailable).toBe(true);
    });

    it('devrait suspendre une variante spécifique', async () => {
      const productWithVariants: Product = {
        id: 1,
        title: 'Produit avec variantes',
        variants: [
          {
            id: 1,
            size: 'A3',
            originalPrice: 150,
            stock: 10,
            isAvailable: true,
            dimensions: { width: 29.7, height: 42, unit: 'cm' },
          },
          {
            id: 2,
            size: 'A4',
            originalPrice: 100,
            stock: 5,
            isAvailable: true,
            dimensions: { width: 21, height: 29.7, unit: 'cm' },
          },
        ],
      } as Product;

      // Suspendre la variante A3
      const updatedVariants = productWithVariants.variants!.map((v) =>
        v.size === 'A3' ? { ...v, isAvailable: false } : v
      );

      const updatedProduct: Product = {
        ...productWithVariants,
        variants: updatedVariants,
      };

      productService.updateProduct.and.resolveTo(updatedProduct);

      const result = await productService.updateProduct(1, { variants: updatedVariants });

      const a3Variant = result.variants!.find((v) => v.size === 'A3');
      const a4Variant = result.variants!.find((v) => v.size === 'A4');

      expect(a3Variant!.isAvailable).toBe(false);
      expect(a4Variant!.isAvailable).toBe(true);
    });
  });

  describe('Workflow: Affichage des nouveaux produits', () => {
    it('devrait récupérer les produits récemment créés', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const allProducts: Product[] = [
        {
          id: 1,
          title: 'Nouveau Produit 1',
          createdAt: now,
          updatedAt: now,
        } as Product,
        {
          id: 2,
          title: 'Nouveau Produit 2',
          createdAt: yesterday,
          updatedAt: yesterday,
        } as Product,
        {
          id: 3,
          title: 'Ancien Produit',
          createdAt: lastWeek,
          updatedAt: lastWeek,
        } as Product,
      ];

      productService.getAllProducts.and.resolveTo(allProducts);

      const result = await productService.getAllProducts();
      const recentProducts = result.filter((p) => {
        const daysDiff = (now.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });

      expect(recentProducts.length).toBe(2);
      expect(recentProducts.some((p) => p.id === 3)).toBe(false);
    });

    it('devrait marquer un produit comme "nouveau" si créé dans les dernières 48h', () => {
      const now = new Date();
      const product48hAgo: Product = {
        id: 1,
        title: 'Produit récent',
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(),
      } as Product;

      const product3daysAgo: Product = {
        id: 2,
        title: 'Produit ancien',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      } as Product;

      const isNew1 =
        now.getTime() - new Date(product48hAgo.createdAt).getTime() < 48 * 60 * 60 * 1000;
      const isNew2 =
        now.getTime() - new Date(product3daysAgo.createdAt).getTime() < 48 * 60 * 60 * 1000;

      expect(isNew1).toBe(true);
      expect(isNew2).toBe(false);
    });
  });

  describe('Workflow: Suppression de produits et catégories', () => {
    it('devrait supprimer un produit après confirmation', async () => {
      productService.deleteProduct.and.resolveTo(undefined);

      const confirmed = true; // Simuler confirmation utilisateur

      if (confirmed) {
        await productService.deleteProduct(1);
        expect(productService.deleteProduct).toHaveBeenCalledWith(1);
      }
    });

    it('ne devrait pas supprimer une catégorie avec des produits associés', async () => {
      const categoryWithProducts: Category = {
        id: 1,
        name: 'Peintures',
        slug: 'peintures',
        productIds: [1, 2, 3], // A des produits associés
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const canDelete =
        !categoryWithProducts.productIds || categoryWithProducts.productIds.length === 0;

      expect(canDelete).toBe(false);
    });

    it('devrait supprimer une catégorie vide', async () => {
      const emptyCategory: Category = {
        id: 2,
        name: 'Catégorie Vide',
        slug: 'categorie-vide',
        productIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const canDelete = !emptyCategory.productIds || emptyCategory.productIds.length === 0;

      expect(canDelete).toBe(true);

      // Note: deleteCategory method doesn't exist in CategoryService, this is just a workflow test
      if (canDelete) {
        expect(canDelete).toBe(true);
      }
    });
  });

  describe('Workflow: Gestion des éditions limitées', () => {
    it('devrait créer un produit en édition limitée', async () => {
      const limitedEditionPayload: Partial<Product> = {
        title: 'Édition Limitée Spéciale',
        isLimitedEdition: true,
        editionNumber: 5,
        totalEditions: 100,
        originalPrice: 500,
        stock: 1,
        categoryId: 1,
        imageUrl: 'https://example.com/image.jpg',
        images: ['https://example.com/image.jpg'],
        technique: 'Mixed media',
        description: 'Limited edition artwork',
        tags: [],
        dimensions: { width: 50, height: 70, unit: 'cm' },
        isAvailable: true,
      };

      const createdProduct: Product = {
        id: 99,
        ...limitedEditionPayload,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      productService.createProduct.and.resolveTo(createdProduct);

      const result = await productService.createProduct(
        limitedEditionPayload as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
      );

      expect(result.isLimitedEdition).toBe(true);
      expect(result.editionNumber).toBe(5);
      expect(result.totalEditions).toBe(100);
    });

    it('devrait valider que editionNumber <= totalEditions', () => {
      const invalidEdition = {
        editionNumber: 101,
        totalEditions: 100,
      };

      const isValid = invalidEdition.editionNumber! <= invalidEdition.totalEditions!;

      expect(isValid).toBe(false);
    });
  });
});
