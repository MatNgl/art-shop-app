// src/app/features/catalog/services/product.ts
import { Injectable, signal, inject } from '@angular/core';
import { CategoryService } from './category';
import { FormatService } from './format.service';
import type {
  Product,
  ProductFilter,
  ProductVariant,
  Dimensions,
  Unit,
} from '../models/product.model';

export interface QuickSuggestion {
  type: 'product' | 'tag';
  label: string;
  value: string;
  image?: string;
}

/** Type d'entrée pour la création (inclut price & stock) */
export type NewProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly categoryService = inject(CategoryService);
  private readonly formatService = inject(FormatService);

  // ————— Helpers typés (évite l'élargissement 'string' -> Unit) —————
  private dim(width: number, height: number, unit: Unit = 'cm', depth?: number): Dimensions {
    return { width, height, unit, ...(typeof depth === 'number' ? { depth } : {}) };
  }

  /**
   * Trouve le formatId correspondant aux dimensions données
   * Comparaison tolérante (±0.5cm ou équivalent)
   */
  private findFormatIdByDimensions(dims: Dimensions): number | undefined {
    const formats = this.formatService.formats();

    // Normaliser en cm
    let w = dims.width;
    let h = dims.height;
    if (dims.unit === 'mm') {
      w = w / 10;
      h = h / 10;
    } else if (dims.unit === 'in') {
      w = w * 2.54;
      h = h * 2.54;
    }

    // Chercher un format qui correspond (tolérance ±0.5cm)
    for (const fmt of formats) {
      let fw = fmt.width;
      let fh = fmt.height;
      if (fmt.unit === 'mm') {
        fw = fw / 10;
        fh = fh / 10;
      } else if (fmt.unit === 'in') {
        fw = fw * 2.54;
        fh = fh * 2.54;
      }

      // Vérifier si les dimensions correspondent (avec ou sans rotation)
      const matches = (
        (Math.abs(w - fw) < 0.5 && Math.abs(h - fh) < 0.5) ||
        (Math.abs(w - fh) < 0.5 && Math.abs(h - fw) < 0.5)
      );

      if (matches) return fmt.id;
    }

    return undefined;
  }

  private makeVariantSeed(
    id: number,
    formatId: number | undefined,
    originalPrice: number,
    reducedPrice: number | undefined,
    stock: number,
    dimensions: Dimensions,
    imageUrl?: string,
    sku?: string
  ): ProductVariant {
    // Auto-detect formatId from dimensions if not provided
    const resolvedFormatId = formatId ?? this.findFormatIdByDimensions(dimensions);

    return {
      id,
      formatId: resolvedFormatId,
      originalPrice, // prix de base
      reducedPrice, // prix réduit si présent (doit être < originalPrice)
      stock,
      isAvailable: stock > 0,
      dimensions,
      imageUrl,
      sku,
    };
  }

  /**
   * Migre les produits existants pour assigner automatiquement les formatIds manquants
   */
  private migrateProductFormats(products: Product[]): Product[] {
    return products.map(product => {
      // Migrer les variantes
      if (product.variants && product.variants.length > 0) {
        const migratedVariants = product.variants.map(variant => {
          if (variant.formatId === undefined || variant.formatId === null) {
            const detectedFormatId = this.findFormatIdByDimensions(variant.dimensions);
            return { ...variant, formatId: detectedFormatId };
          }
          return variant;
        });
        return { ...product, variants: migratedVariants };
      }

      // Migrer le formatId du produit simple
      if (!product.variants && (product.formatId === undefined || product.formatId === null)) {
        const detectedFormatId = product.dimensions ? this.findFormatIdByDimensions(product.dimensions) : undefined;
        return { ...product, formatId: detectedFormatId };
      }

      return product;
    });
  }

  // ======= Seed : quelques produits avec variantes pour démonstration =======
  private products = signal<Product[]>(
    this.migrateProductFormats(
    [
      {
        id: 3,
        title: 'Abstraction Colorée',
        description:
          'Une explosion de couleurs et de formes géométriques créant une composition dynamique et moderne.',
        originalPrice: 280,
        categoryId: 3,
        subCategoryIds: [301], // Illustration 2D
        tags: ['abstrait', 'coloré', 'géométrique', 'moderne'],
        imageUrl:
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        ],
        technique: 'Art numérique',
        dimensions: this.dim(40, 40, 'cm'),
        isAvailable: true,
        stock: 52,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(5, undefined, 90, 81, 25, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(6, undefined, 70, 63, 12, this.dim(21, 14.8, 'cm')),
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
      {
        id: 4,
        title: 'Nature Morte Classique',
        description:
          'Une composition élégante des objets du quotidien dans un style classique, jouant avec la lumière et les ombres.',
        originalPrice: 380,
        categoryId: 2,
        subCategoryIds: [201], // Huile
        tags: ['nature morte', 'classique', 'lumière', 'tradition'],
        imageUrl: 'assets/products/IMG_6265.JPG',
        images: ['assets/products/IMG_6265.JPG', 'assets/products/mock_tableau.png'],
        technique: 'Huile sur toile',
        dimensions: this.dim(45, 35, 'cm'),
        isAvailable: true,
        stock: 12,
        isLimitedEdition: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: 5,
        title: 'Paysage Montagnard',
        description:
          'Vue panoramique des Alpes capturant la majesté des sommets enneigés et la sérénité de la nature.',
        originalPrice: 520,
        categoryId: 4,
        subCategoryIds: [402], // Paysage
        tags: ['paysage', 'montagne', 'nature', 'panoramique'],
        imageUrl:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        ],
        technique: 'Photographie numérique',
        dimensions: this.dim(70, 50, 'cm'),
        isAvailable: true,
        stock: 31,
        isLimitedEdition: true,
        editionNumber: 2,
        totalEditions: 10,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
      },
      {
        id: 6,
        title: 'Esquisse Urbaine',
        description:
          'Croquis rapide de la vie urbaine, capturant les énergies et le mouvement de la ville.',
        originalPrice: 150,
        categoryId: 1,
        subCategoryIds: [102, 103], // Crayon + Encre
        tags: ['esquisse', 'urbain', 'croquis', 'mouvement'],
        imageUrl: 'assets/products/IMG_6264.JPG',
        images: ['assets/products/IMG_6264.JPG'],
        technique: 'Crayon et encre',
        dimensions: this.dim(25, 35, 'cm'),
        isAvailable: true,
        stock: 17,
        isLimitedEdition: false,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        id: 7,
        title: 'Crevette',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 220,
        reducedPrice: 198, // réduit
        categoryId: 4,
        subCategoryIds: [402], // Paysage
        tags: ['photo', 'original', 'collection'],
        imageUrl: 'assets/products/IMG_3900.JPG',
        images: ['assets/products/IMG_3900.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 23,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      },
      {
        id: 8,
        title: 'Fleur dans son vase',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 230,
        categoryId: 4,
        subCategoryIds: [401], // Portrait
        tags: ['photo', 'collection'],
        imageUrl: 'assets/products/IMG_3927.JPG',
        images: ['assets/products/IMG_3927.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 46,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-02'),
        updatedAt: new Date('2024-03-02'),
      },
      {
        id: 9,
        title: 'Nénu',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 210,
        categoryId: 4,
        subCategoryIds: [402], // Paysage
        tags: ['photo', 'original'],
        imageUrl: 'assets/products/IMG_3930.JPG',
        images: ['assets/products/IMG_3930.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 11,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-03'),
        updatedAt: new Date('2024-03-03'),
      },
      {
        id: 10,
        title: 'Nature morte aux citrons',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 245,
        reducedPrice: 221, // réduit
        categoryId: 4,
        subCategoryIds: [401], // Portrait
        tags: ['photo', 'édition'],
        imageUrl: 'assets/products/IMG_3931.JPG',
        images: ['assets/products/IMG_3931.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 26,
        isLimitedEdition: true,
        editionNumber: 1,
        totalEditions: 10,
        createdAt: new Date('2024-03-04'),
        updatedAt: new Date('2024-03-04'),
      },
      {
        id: 11,
        title: 'Crépuscule sur le rivage',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 235,
        categoryId: 4,
        subCategoryIds: [402], // Paysage
        tags: ['photo', 'collection'],
        imageUrl: 'assets/products/IMG_3959.JPG',
        images: ['assets/products/IMG_3959.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 22,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
      },
      {
        id: 12,
        title: 'Ciel sur la cathédrale',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 240,
        categoryId: 4,
        subCategoryIds: [403], // Urbain
        tags: ['photo', 'original'],
        imageUrl: 'assets/products/IMG_4054.JPG',
        images: ['assets/products/IMG_4054.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 75,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-06'),
        updatedAt: new Date('2024-03-06'),
      },
      {
        id: 13,
        title: 'Tapisserie solaire',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 255,
        reducedPrice: 230, // réduit
        categoryId: 4,
        subCategoryIds: [403], // Urbain
        tags: ['photo', 'promo'],
        imageUrl: 'assets/products/IMG_5378.JPG',
        images: ['assets/products/IMG_5378.JPG', 'assets/products/IMG_5378.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 200,
        isLimitedEdition: false,
        createdAt: new Date('2024-03-07'),
        updatedAt: new Date('2024-03-07'),
      },
      {
        id: 14,
        title: 'Anémone ivoire',
        description: 'Photographie originale issue de votre collection personnelle.',
        originalPrice: 265,
        categoryId: 4,
        subCategoryIds: [402], // Paysage
        tags: ['photo', 'collection'],
        imageUrl: 'assets/products/IMG_6034.JPG',
        images: ['assets/products/IMG_6034.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 112,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(41, undefined, 265, undefined, 35, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(42, undefined, 195, undefined, 45, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(43, undefined, 145, undefined, 22, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(44, undefined, 105, undefined, 10, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-08'),
        updatedAt: new Date('2024-03-08'),
      },
      {
        id: 15,
        title: 'Fraisier',
        description: 'Croquis de fraises réalisé au crayon graphique sur papier texturé.',
        originalPrice: 90,
        categoryId: 1,
        subCategoryIds: [102], // Crayon
        tags: ['dessin', 'graphite', 'étude'],
        imageUrl: 'assets/products/fraisier.png',
        images: ['assets/products/fraisier.png'],
        technique: 'Crayon graphite 2B sur papier 180g',
        dimensions: this.dim(21, 29.7, 'cm'),
        isAvailable: true,
        stock: 38,
        isLimitedEdition: false,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15'),
      },
      {
        id: 16,
        title: 'Baignade de tigres',
        description: 'Dessin avec encre et lavis, textures organiques et lignes légères.',
        originalPrice: 140,
        categoryId: 1,
        subCategoryIds: [103], // Encre
        tags: ['dessin', 'encre', 'nature'],
        imageUrl: 'assets/products/tiger.JPG',
        images: ['assets/products/tiger.JPG'],
        technique: 'Encre & lavis sur papier coton',
        dimensions: this.dim(30, 40, 'cm'),
        isAvailable: true,
        stock: 62,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(51, undefined, 180, 162, 18, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(52, undefined, 140, 126, 24, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(53, undefined, 100, undefined, 12, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(54, undefined, 75, undefined, 8, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-02'),
        updatedAt: new Date('2024-03-04'),
      },
      {
        id: 17,
        title: 'Desert de sable',
        description: 'Desert du sahara, contrastes profonds et gestes vifs.',
        originalPrice: 220,
        categoryId: 1,
        subCategoryIds: [101], // Fusain
        tags: ['dessin', 'fusain', 'portrait'],
        imageUrl: 'assets/products/desert.JPG',
        images: ['assets/products/desert.JPG'],
        technique: 'Fusain sur papier 200g',
        dimensions: this.dim(35, 50, 'cm'),
        isAvailable: true,
        stock: 27,
        isLimitedEdition: true,
        variants: [
          this.makeVariantSeed(61, undefined, 220, 198, 10, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(62, undefined, 175, 158, 8, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(63, undefined, 130, undefined, 6, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(64, undefined, 95, undefined, 3, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-12'),
        updatedAt: new Date('2024-03-12'),
      },
    ].map((p) => this.syncComputedFieldsFromVariants(p))
    )
  );

  // ===== Utils

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Recalcule les champs "compatibilité" à partir des variantes :
   * - originalPrice = min(prix variantes dispo) ou min(toutes) si aucune dispo
   * - reducedPrice = min des prix RÉDUITS (< originalPrice) si présentes
   * - stock = somme des stocks variantes
   * - isAvailable = stock > 0
   */
  private syncComputedFieldsFromVariants(p: Product): Product {
    const variants: ProductVariant[] = p.variants ?? [];
    if (variants.length === 0) return { ...p };

    const totalStock = variants.reduce<number>((sum, v) => sum + Math.max(0, v.stock), 0);
    const available = variants.filter((v) => v.isAvailable && v.stock > 0);
    const pricePool = (available.length > 0 ? available : variants).map((v) => v.originalPrice);
    const minPrice = pricePool.length ? Math.min(...pricePool) : p.originalPrice;

    const reducedPool = (available.length > 0 ? available : variants)
      .filter((v) => typeof v.reducedPrice === 'number' && v.reducedPrice! < v.originalPrice)
      .map((v) => v.reducedPrice!) as number[];

    return {
      ...p,
      originalPrice: minPrice,
      reducedPrice: reducedPool.length ? Math.min(...reducedPool) : p.reducedPrice,
      stock: totalStock,
      isAvailable: totalStock > 0,
      updatedAt: new Date(),
    };
  }

  private getVariant(product: Product, variantId: number): ProductVariant | undefined {
    return (product.variants ?? []).find((v) => v.id === variantId);
  }

  // ===== Queries (APIs publiques)

  async getAll(): Promise<Product[]> {
    await this.delay(300);
    return [...this.products()];
  }

  async getAllProducts(): Promise<Product[]> {
    return this.getAll();
  }

  /**
   * Filtre les produits pour exclure ceux appartenant à des catégories/sous-catégories inactives
   */
  private async filterByActiveCategoriesAndSubCategories(products: Product[]): Promise<Product[]> {
    const allCategories = await this.categoryService.getAll();
    return products.filter((p) => {
      // Vérifier si la catégorie est active
      const category = allCategories.find((c) => c.id === p.categoryId);
      if (!category || !category.isActive) return false;

      // Vérifier si les sous-catégories sont actives
      if (p.subCategoryIds && p.subCategoryIds.length > 0) {
        const hasActiveSubCategory = p.subCategoryIds.some((subId) => {
          const subCategory = category.subCategories?.find((s) => s.id === subId);
          return subCategory && subCategory.isActive;
        });
        // Si le produit a des sous-catégories, au moins une doit être active
        if (!hasActiveSubCategory) return false;
      }

      return true;
    });
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.delay(200);
    const product = this.products().find((p) => p.id === id);
    return product ?? null;
  }

  async getPublicProductById(id: number): Promise<Product | null> {
    const p = await this.getProductById(id);
    if (!p || !p.isAvailable) return null;

    // Vérifier que la catégorie et sous-catégorie sont actives
    const filtered = await this.filterByActiveCategoriesAndSubCategories([p]);
    return filtered.length > 0 ? p : null;
  }

  async getAllPublic(): Promise<Product[]> {
    const all = await this.getAll();
    const available = all.filter((p) => p.isAvailable);
    return this.filterByActiveCategoriesAndSubCategories(available);
  }

  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    await this.delay(250);
    return this.products().filter((p) => p.categoryId === categoryId);
  }

  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    await this.delay(200);
    const available = this.products().filter((p) => p.isAvailable);
    const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
    const products = filtered
      .sort((a, b) => {
        const aHasReduced = typeof a.reducedPrice === 'number' && a.reducedPrice < a.originalPrice;
        const bHasReduced = typeof b.reducedPrice === 'number' && b.reducedPrice < b.originalPrice;
        if (aHasReduced && !bHasReduced) return -1;
        if (!aHasReduced && bHasReduced) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);

    return products;
  }

  async getProductsByDateRange(startDate: string, endDate: string, limit = 10): Promise<Product[]> {
    await this.delay(250);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const available = this.products()
        .filter((p) => {
          const createdAt = new Date(p.createdAt);
          return createdAt >= start && createdAt <= end && p.isAvailable;
        });

      const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
      return filtered
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch {
      return this.getFeaturedProducts(limit);
    }
  }

  async getRecentProducts(limit = 10): Promise<Product[]> {
    await this.delay(200);
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const available = this.products()
        .filter((p) => {
          const createdAt = new Date(p.createdAt);
          return createdAt >= oneMonthAgo && p.isAvailable;
        });

      const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
      const recent = filtered
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      if (recent.length < limit) {
        const allAvailable = this.products().filter((p) => p.isAvailable && !recent.includes(p));
        const allFiltered = await this.filterByActiveCategoriesAndSubCategories(allAvailable);
        const additional = allFiltered
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit - recent.length);

        recent.push(...additional);
      }

      return recent;
    } catch {
      return this.getFeaturedProducts(limit);
    }
  }

  async getPromotionProducts(limit = 8): Promise<Product[]> {
    await this.delay(200);
    try {
      const available = this.products()
        .filter(
          (p) => typeof p.reducedPrice === 'number' && p.reducedPrice < p.originalPrice && p.isAvailable
        );

      const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
      const promotions = filtered
        .sort((a, b) => {
          const discA = ((a.originalPrice - (a.reducedPrice as number)) / a.originalPrice) * 100;
          const discB = ((b.originalPrice - (b.reducedPrice as number)) / b.originalPrice) * 100;
          return discB - discA;
        })
        .slice(0, limit);

      return promotions;
    } catch {
      const featured = await this.getFeaturedProducts(limit);
      return featured.map((product) => ({
        ...product,
        reducedPrice: Math.round(product.originalPrice * 0.9), // réduit 10%
      }));
    }
  }

  async getProductsByCategory(categoryId: number, limit = 10): Promise<Product[]> {
    await this.delay(200);
    try {
      const available = this.products()
        .filter((p) => p.categoryId === categoryId && p.isAvailable);

      const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
      return filtered
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  async getRandomProducts(limit = 12): Promise<Product[]> {
    await this.delay(200);
    try {
      const available = this.products().filter((p) => p.isAvailable);
      const filtered = await this.filterByActiveCategoriesAndSubCategories(available);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch {
      return this.getFeaturedProducts(limit);
    }
  }

  /**
   * Filtre min/max price prend en compte le prix "effectif" (min de variantes).
   */
  async filterProducts(filters: ProductFilter): Promise<Product[]> {
    await this.delay(300);
    let filtered = this.products();

    // disponibilité
    if (typeof filters.isAvailable === 'boolean') {
      filtered = filtered.filter((p) => p.isAvailable === filters.isAvailable);
    } else {
      filtered = filtered.filter((p) => p.isAvailable);
    }

    // Exclure les produits des catégories/sous-catégories inactives
    filtered = await this.filterByActiveCategoriesAndSubCategories(filtered);

    // catégorie
    if (typeof filters.categoryId === 'number') {
      filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
    }

    // catégorie par slug
    if (filters.categorySlug) {
      const cats = await this.categoryService.getAll();
      const cat = cats.find((c) => c.slug.toLowerCase() === filters.categorySlug!.toLowerCase());
      filtered = cat ? filtered.filter((p) => p.categoryId === cat.id) : [];
    }

    // sous-catégorie par ID
    if (typeof filters.subCategoryId === 'number') {
      filtered = filtered.filter((p) =>
        (p.subCategoryIds ?? []).includes(filters.subCategoryId!)
      );
    }

    // sous-catégorie par slug
    if (filters.subCategorySlug && filters.categorySlug) {
      const sub = await this.categoryService.getSubCategoryBySlug(
        filters.categorySlug,
        filters.subCategorySlug
      );
      if (sub) {
        filtered = filtered.filter((p) => (p.subCategoryIds ?? []).includes(sub.id));
      } else {
        filtered = [];
      }
    }

    // min/max price (sur p.originalPrice = min des variantes)
    if (typeof filters.minPrice === 'number') {
      filtered = filtered.filter((p) => p.originalPrice >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number') {
      filtered = filtered.filter((p) => p.originalPrice <= filters.maxPrice!);
    }

    // technique
    if (filters.technique && filters.technique.trim().length > 0) {
      const t = filters.technique.toLowerCase();
      filtered = filtered.filter((p) => p.technique.toLowerCase().includes(t));
    }

    // recherche globale
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
      return filtered;
    }

    return filtered;
  }

  /** Ancienne API conservée pour compatibilité */
  async searchProducts(filters: ProductFilter): Promise<Product[]> {
    return this.filterProducts(filters);
  }

  // ===== Stats par catégorie (indexées par ID)

  getCategoryCountsSync(): Record<number, number> {
    const out: Record<number, number> = {};
    for (const p of this.products()) {
      const id = p.categoryId;
      if (typeof id === 'number') out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  }

  async getCategoryCounts(): Promise<Record<number, number>> {
    await this.delay(150);
    return this.getCategoryCountsSync();
  }

  async getCountForCategoryId(categoryId: number): Promise<number> {
    await this.delay(120);
    return this.products().filter((p) => p.categoryId === categoryId).length;
  }

  // Comptage par sous-catégorie
  getSubCategoryCountsSync(): Record<number, number> {
    const out: Record<number, number> = {};
    for (const p of this.products()) {
      const subIds = p.subCategoryIds ?? [];
      for (const subId of subIds) {
        out[subId] = (out[subId] ?? 0) + 1;
      }
    }
    return out;
  }

  async getSubCategoryCounts(): Promise<Record<number, number>> {
    await this.delay(150);
    return this.getSubCategoryCountsSync();
  }

  async getCountForSubCategoryId(subCategoryId: number): Promise<number> {
    await this.delay(120);
    return this.products().filter((p) =>
      (p.subCategoryIds ?? []).includes(subCategoryId)
    ).length;
  }

  async quickSearchSuggestions(term: string, limit = 6): Promise<QuickSuggestion[]> {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const results: QuickSuggestion[] = [];
    const available = this.products().filter((p) => p.isAvailable);
    const products = await this.filterByActiveCategoriesAndSubCategories(available);

    // Produits disponibles
    const seenProductIds = new Set<number>();
    for (const p of products) {
      if (
        (p.title.toLowerCase().includes(q) || String(p.id).includes(q)) &&
        !seenProductIds.has(p.id)
      ) {
        results.push({
          type: 'product',
          label: p.title,
          value: String(p.id),
          image: p.imageUrl,
        });
        seenProductIds.add(p.id);
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    // Tags uniques
    const uniqueTags = [...new Set(products.flatMap((p) => p.tags))];
    for (const t of uniqueTags) {
      if (t.toLowerCase().includes(q)) {
        results.push({ type: 'tag', label: t, value: t });
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    return results.slice(0, limit);
  }

  // ===== Mutations (Produits)

  async updateProductAvailability(id: number, isAvailable: boolean): Promise<void> {
    await this.delay(300);
    const list = this.products();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Produit avec l'id ${id} introuvable`);

    const next = [...list];
    next[idx] = { ...next[idx], isAvailable, updatedAt: new Date() };
    this.products.set(next);
  }

  /** Correction: on conserve le price/stock fournis quand il n'y a pas de variantes */
  async createProduct(productData: NewProductInput): Promise<Product> {
    await this.delay(300);
    const list = this.products();
    const newId = (list.length ? Math.max(...list.map((p) => p.id)) : 0) + 1;

    const base: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Si variantes: recalcul price/stock depuis variantes.
    const newProduct = this.syncComputedFieldsFromVariants(base);

    this.products.set([...list, newProduct]);

    if (typeof newProduct.categoryId === 'number') {
      await this.categoryService.attachProducts(newProduct.categoryId, [newId]);
    }

    return newProduct;
  }

  private async moveProductToCategory(
    productId: number,
    nextCategoryId?: number | null
  ): Promise<void> {
    const cats = await this.categoryService.getAll();

    // détacher de l'ancienne catégorie
    const prev = cats.find((c) => (c.productIds ?? []).includes(productId));
    if (prev) {
      await this.categoryService.detachProducts(prev.id, [productId]);
    }

    // attacher à la nouvelle
    if (typeof nextCategoryId === 'number') {
      await this.categoryService.attachProducts(nextCategoryId, [productId]);
    }
  }

  async updateProduct(id: number, patch: Partial<Product>): Promise<Product> {
    await this.delay(300);
    const list = this.products();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Produit avec l'id ${id} introuvable`);

    if ('categoryId' in patch) {
      await this.moveProductToCategory(id, patch.categoryId ?? null);
    }

    const updatedRaw: Product = { ...list[idx], ...patch, id, updatedAt: new Date() };
    const updated = this.syncComputedFieldsFromVariants(updatedRaw);
    const next = [...list];
    next[idx] = updated;
    this.products.set(next);

    return updated;
  }

  /** @deprecated Utilisez updateVariantStock si le produit possède des variantes. */
  async updateProductStock(id: number, newStock: number): Promise<void> {
    await this.delay(200);
    if (newStock < 0) throw new Error('Le stock ne peut pas être négatif');

    const product = await this.getProductById(id);
    if (!product) throw new Error(`Produit avec l'id ${id} introuvable`);

    if (product.variants && product.variants.length > 0) {
      throw new Error(
        'updateProductStock indisponible pour un produit avec variantes. Utilisez updateVariantStock.'
      );
    }

    await this.updateProduct(id, {
      stock: newStock,
      isAvailable: newStock > 0,
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await this.delay(200);
    const list = this.products();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Produit avec l'id ${id} introuvable`);
    const next = [...list];
    next.splice(idx, 1);
    this.products.set(next);
  }

  // ===== Mutations (Variantes)

  async addVariant(
    productId: number,
    variant: Omit<ProductVariant, 'id' | 'isAvailable'>
  ): Promise<Product> {
    await this.delay(200);
    const list = this.products();
    const idx = list.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error(`Produit avec l'id ${productId} introuvable`);

    const product = list[idx];
    const newVariantId =
      (product.variants && product.variants.length
        ? Math.max(...product.variants.map((v) => v.id))
        : 0) + 1;

    const v: ProductVariant = {
      ...variant,
      id: newVariantId,
      isAvailable: variant.stock > 0,
    };

    const updated = await this.updateProduct(productId, {
      variants: [...(product.variants ?? []), v],
    });

    return updated;
  }

  async updateVariant(
    productId: number,
    variantId: number,
    patch: Partial<ProductVariant>
  ): Promise<Product> {
    await this.delay(200);
    const product = await this.getProductById(productId);
    if (!product) throw new Error(`Produit avec l'id ${productId} introuvable`);

    const variants = product.variants ?? [];
    const vidx = variants.findIndex((v) => v.id === variantId);
    if (vidx === -1)
      throw new Error(`Variante ${variantId} introuvable pour le produit ${productId}`);

    const prev = variants[vidx];
    const nextVariant: ProductVariant = {
      ...prev,
      ...patch,
      id: variantId,
      isAvailable:
        typeof patch.stock === 'number'
          ? patch.stock > 0
          : typeof patch.isAvailable === 'boolean'
          ? patch.isAvailable
          : prev.stock > 0,
    };

    const nextVariants = [...variants];
    nextVariants[vidx] = nextVariant;

    const updated = await this.updateProduct(productId, { variants: nextVariants });
    return updated;
  }

  async updateVariantStock(
    productId: number,
    variantId: number,
    newStock: number
  ): Promise<Product> {
    if (newStock < 0) throw new Error('Le stock variante ne peut pas être négatif');
    return this.updateVariant(productId, variantId, { stock: newStock });
  }

  async removeVariant(productId: number, variantId: number): Promise<Product> {
    await this.delay(150);
    const product = await this.getProductById(productId);
    if (!product) throw new Error(`Produit avec l'id ${productId} introuvable`);

    const kept = (product.variants ?? []).filter((v) => v.id !== variantId);
    const updated = await this.updateProduct(productId, { variants: kept });
    return updated;
  }

  // ===== Helpers publics

  /**
   * Prix unitaire à utiliser pour une ligne panier : variante si présente, sinon produit.
   */
  getUnitPriceForCart(item: { product: Product; variant?: ProductVariant }): number {
    return item.variant?.originalPrice ?? item.product.originalPrice;
  }

  /**
   * Récupère une variante par id (si existante).
   */
  async getVariantById(productId: number, variantId: number): Promise<ProductVariant | null> {
    const p = await this.getProductById(productId);
    if (!p) return null;
    return this.getVariant(p, variantId) ?? null;
  }
}
