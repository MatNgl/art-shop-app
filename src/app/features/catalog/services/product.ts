// src/app/features/catalog/services/product.ts
import { Injectable, signal, inject } from '@angular/core';
import { CategoryService } from './category';
import type {
  Product,
  ProductFilter,
  ProductVariant,
  PrintSize,
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

  // ————— Helpers typés (évite l'élargissement 'string' -> Unit) —————
  private dim(width: number, height: number, unit: Unit = 'cm', depth?: number): Dimensions {
    return { width, height, unit, ...(typeof depth === 'number' ? { depth } : {}) };
  }

  private makeVariantSeed(
    id: number,
    size: PrintSize,
    price: number,
    originalPrice: number | undefined,
    stock: number,
    dimensions: Dimensions,
    imageUrl?: string,
    sku?: string
  ): ProductVariant {
    return {
      id,
      size,
      price, // prix de base
      originalPrice, // prix réduit si présent (doit être < price)
      stock,
      isAvailable: stock > 0,
      dimensions,
      imageUrl,
      sku,
    };
  }

  // ======= Seed : quelques produits avec variantes pour démonstration =======
  private products = signal<Product[]>(
    [
      {
        id: 1,
        title: 'Paysage Urbain au Crépuscule',
        description:
          'Une vue impressionnante de la ville au coucher du soleil, capturant les jeux de lumière entre les bâtiments modernes.',
        price: 450,
        originalPrice: 405, // réduit (10%)
        categoryId: 2,
        tags: ['urbain', 'crépuscule', 'moderne', 'architecture'],
        imageUrl:
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519681393784-d120c3b4fd18?w=800&h=600&fit=crop',
        ],
        technique: 'Huile sur toile',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 32,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(1, 'A3', 320, 288, 8, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(2, 'A4', 260, 234, 12, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(3, 'A5', 200, undefined, 7, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(4, 'A6', 160, undefined, 5, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 2,
        title: 'Monochrome',
        description:
          'Un portrait saisissant explorant les émotions humaines à travers des traits expressifs et des couleurs vibrantes.',
        price: 320,
        categoryId: 1,
        tags: ['portrait', 'expressif', 'émotion', 'visage'],
        imageUrl:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        ],
        technique: 'Fusain et pastel',
        dimensions: this.dim(35, 50, 'cm'),
        isAvailable: true,
        stock: 100,
        isLimitedEdition: true,
        editionNumber: 1,
        totalEditions: 5,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 3,
        title: 'Abstraction Colorée',
        description:
          'Une explosion de couleurs et de formes géométriques créant une composition dynamique et moderne.',
        price: 280,
        categoryId: 3,
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
          this.makeVariantSeed(5, 'A4', 90, 81, 25, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(6, 'A5', 70, 63, 12, this.dim(21, 14.8, 'cm')),
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
      {
        id: 4,
        title: 'Nature Morte Classique',
        description:
          'Une composition élégante des objets du quotidien dans un style classique, jouant avec la lumière et les ombres.',
        price: 380,
        categoryId: 2,
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
        price: 520,
        categoryId: 4,
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
        price: 150,
        categoryId: 1,
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
        price: 220,
        originalPrice: 198, // réduit
        categoryId: 4,
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
        price: 230,
        categoryId: 4,
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
        price: 210,
        categoryId: 4,
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
        price: 245,
        originalPrice: 221, // réduit
        categoryId: 4,
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
        price: 235,
        categoryId: 4,
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
        price: 240,
        categoryId: 4,
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
        price: 255,
        originalPrice: 230, // réduit
        categoryId: 4,
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
        price: 265,
        categoryId: 4,
        tags: ['photo', 'collection'],
        imageUrl: 'assets/products/IMG_6034.JPG',
        images: ['assets/products/IMG_6034.JPG'],
        technique: 'Photographie numérique',
        dimensions: this.dim(60, 40, 'cm'),
        isAvailable: true,
        stock: 112,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(41, 'A3', 265, undefined, 35, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(42, 'A4', 195, undefined, 45, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(43, 'A5', 145, undefined, 22, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(44, 'A6', 105, undefined, 10, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-08'),
        updatedAt: new Date('2024-03-08'),
      },
      {
        id: 15,
        title: 'Fraisier',
        description: 'Croquis de fraises réalisé au crayon graphique sur papier texturé.',
        price: 90,
        categoryId: 1,
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
        price: 140,
        categoryId: 1,
        tags: ['dessin', 'encre', 'nature'],
        imageUrl: 'assets/products/tiger.JPG',
        images: ['assets/products/tiger.JPG'],
        technique: 'Encre & lavis sur papier coton',
        dimensions: this.dim(30, 40, 'cm'),
        isAvailable: true,
        stock: 62,
        isLimitedEdition: false,
        variants: [
          this.makeVariantSeed(51, 'A3', 180, 162, 18, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(52, 'A4', 140, 126, 24, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(53, 'A5', 100, undefined, 12, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(54, 'A6', 75, undefined, 8, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-02'),
        updatedAt: new Date('2024-03-04'),
      },
      {
        id: 17,
        title: 'Desert de sable',
        description: 'Desert du sahara, contrastes profonds et gestes vifs.',
        price: 220,
        categoryId: 1,
        tags: ['dessin', 'fusain', 'portrait'],
        imageUrl: 'assets/products/desert.JPG',
        images: ['assets/products/desert.JPG'],
        technique: 'Fusain sur papier 200g',
        dimensions: this.dim(35, 50, 'cm'),
        isAvailable: true,
        stock: 27,
        isLimitedEdition: true,
        variants: [
          this.makeVariantSeed(61, 'A3', 220, 198, 10, this.dim(42, 29.7, 'cm')),
          this.makeVariantSeed(62, 'A4', 175, 158, 8, this.dim(29.7, 21, 'cm')),
          this.makeVariantSeed(63, 'A5', 130, undefined, 6, this.dim(21, 14.8, 'cm')),
          this.makeVariantSeed(64, 'A6', 95, undefined, 3, this.dim(14.8, 10.5, 'cm')),
        ],
        createdAt: new Date('2024-03-12'),
        updatedAt: new Date('2024-03-12'),
      },
    ].map((p) => this.syncComputedFieldsFromVariants(p))
  );

  // ===== Utils

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Recalcule les champs "compatibilité" à partir des variantes :
   * - price = min(prix variantes dispo) ou min(toutes) si aucune dispo
   * - originalPrice = min des prix RÉDUITS (< price) si présentes
   * - stock = somme des stocks variantes
   * - isAvailable = stock > 0
   */
  private syncComputedFieldsFromVariants(p: Product): Product {
    const variants: ProductVariant[] = p.variants ?? [];
    if (variants.length === 0) return { ...p };

    const totalStock = variants.reduce<number>((sum, v) => sum + Math.max(0, v.stock), 0);
    const available = variants.filter((v) => v.isAvailable && v.stock > 0);
    const pricePool = (available.length > 0 ? available : variants).map((v) => v.price);
    const minPrice = pricePool.length ? Math.min(...pricePool) : p.price;

    const reducedPool = (available.length > 0 ? available : variants)
      .filter((v) => typeof v.originalPrice === 'number' && v.originalPrice! < v.price)
      .map((v) => v.originalPrice!) as number[];

    return {
      ...p,
      price: minPrice,
      originalPrice: reducedPool.length ? Math.min(...reducedPool) : p.originalPrice,
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

  async getProductById(id: number): Promise<Product | null> {
    await this.delay(200);
    const product = this.products().find((p) => p.id === id);
    return product ?? null;
  }

  async getPublicProductById(id: number): Promise<Product | null> {
    const p = await this.getProductById(id);
    return p && p.isAvailable ? p : null;
  }

  async getAllPublic(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.isAvailable);
  }

  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    await this.delay(250);
    return this.products().filter((p) => p.categoryId === categoryId);
  }

  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    await this.delay(200);
    const products = this.products()
      .filter((p) => p.isAvailable)
      .sort((a, b) => {
        const aHasReduced = typeof a.originalPrice === 'number' && a.originalPrice < a.price;
        const bHasReduced = typeof b.originalPrice === 'number' && b.originalPrice < b.price;
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

      const filtered = this.products()
        .filter((p) => {
          const createdAt = new Date(p.createdAt);
          return createdAt >= start && createdAt <= end && p.isAvailable;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      return filtered;
    } catch {
      return this.getFeaturedProducts(limit);
    }
  }

  async getRecentProducts(limit = 10): Promise<Product[]> {
    await this.delay(200);
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recent = this.products()
        .filter((p) => {
          const createdAt = new Date(p.createdAt);
          return createdAt >= oneMonthAgo && p.isAvailable;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      if (recent.length < limit) {
        const additional = this.products()
          .filter((p) => p.isAvailable && !recent.includes(p))
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
      const promotions = this.products()
        .filter(
          (p) => typeof p.originalPrice === 'number' && p.originalPrice < p.price && p.isAvailable
        )
        .sort((a, b) => {
          const discA = ((a.price - (a.originalPrice as number)) / a.price) * 100;
          const discB = ((b.price - (b.originalPrice as number)) / b.price) * 100;
          return discB - discA;
        })
        .slice(0, limit);

      return promotions;
    } catch {
      const featured = await this.getFeaturedProducts(limit);
      return featured.map((product) => ({
        ...product,
        originalPrice: Math.round(product.price * 0.9), // réduit 10%
      }));
    }
  }

  async getProductsByCategory(categoryId: number, limit = 10): Promise<Product[]> {
    await this.delay(200);
    try {
      const filtered = this.products()
        .filter((p) => p.categoryId === categoryId && p.isAvailable)
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, limit);

      return filtered;
    } catch {
      return [];
    }
  }

  async getRandomProducts(limit = 12): Promise<Product[]> {
    await this.delay(200);
    try {
      const available = this.products().filter((p) => p.isAvailable);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
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

    // min/max price (sur p.price = min des variantes)
    if (typeof filters.minPrice === 'number') {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number') {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
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

  async quickSearchSuggestions(term: string, limit = 6): Promise<QuickSuggestion[]> {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const results: QuickSuggestion[] = [];
    const products = this.products();

    // Produits disponibles
    const seenProductIds = new Set<number>();
    for (const p of products) {
      if (!p.isAvailable) continue;
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
    const uniqueTags = [...new Set(products.filter((p) => p.isAvailable).flatMap((p) => p.tags))];
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
    return item.variant?.price ?? item.product.price;
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
