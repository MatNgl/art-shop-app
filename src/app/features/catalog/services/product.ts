import { Injectable, signal, inject } from '@angular/core';
import { Product, ProductFilter } from '../models/product.model';
import { CategoryService } from './category';

export interface QuickSuggestion {
  type: 'product' | 'tag';
  label: string;
  value: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly categoryService = inject(CategoryService);

  private products = signal<Product[]>([
    {
      id: 1,
      title: 'Paysage Urbain au Crépuscule',
      description:
        'Une vue impressionnante de la ville au coucher du soleil, capturant les jeux de lumière entre les bâtiments modernes.',
      price: 450,
      originalPrice: 500,
      categoryId: 2, // Peinture
      tags: ['urbain', 'crépuscule', 'moderne', 'architecture'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519681393784-d120c3b4fd18?w=800&h=600&fit=crop',
      ],
      technique: 'Huile sur toile',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 32,
      isLimitedEdition: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 2,
      title: 'Monochrome',
      description:
        'Un portrait saisissant explorant les émotions humaines à travers des traits expressifs et des couleurs vibrantes.',
      price: 320,
      categoryId: 1, // Dessin
      tags: ['portrait', 'expressif', 'émotion', 'visage'],
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'],
      technique: 'Fusain et pastel',
      dimensions: { width: 35, height: 50, unit: 'cm' },
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
      categoryId: 3, // Art numérique
      tags: ['abstrait', 'coloré', 'géométrique', 'moderne'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop'],
      technique: 'Art numérique',
      dimensions: { width: 40, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 52,
      isLimitedEdition: false,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
    {
      id: 4,
      title: 'Nature Morte Classique',
      description:
        'Une composition élégante des objets du quotidien dans un style classique, jouant avec la lumière et les ombres.',
      price: 380,
      categoryId: 2, // Peinture
      tags: ['nature morte', 'classique', 'lumière', 'tradition'],
      imageUrl: 'assets/products/IMG_6265.JPG',
      images: ['assets/products/IMG_6265.JPG', 'assets/products/mock_tableau.png'],
      technique: 'Huile sur toile',
      dimensions: { width: 45, height: 35, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['paysage', 'montagne', 'nature', 'panoramique'],
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
      technique: 'Photographie numérique',
      dimensions: { width: 70, height: 50, unit: 'cm' },
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
      categoryId: 1, // Dessin
      tags: ['esquisse', 'urbain', 'croquis', 'mouvement'],
      imageUrl: 'assets/products/IMG_6264.JPG',
      images: ['assets/products/IMG_6264.JPG'],
      technique: 'Crayon et encre',
      dimensions: { width: 25, height: 35, unit: 'cm' },
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
      originalPrice: 260,
      categoryId: 4, // Photographie
      tags: ['photo', 'original', 'collection'],
      imageUrl: 'assets/products/IMG_3900.JPG',
      images: ['assets/products/IMG_3900.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3927.JPG',
      images: ['assets/products/IMG_3927.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_3930.JPG',
      images: ['assets/products/IMG_3930.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      originalPrice: 270,
      categoryId: 4, // Photographie
      tags: ['photo', 'édition'],
      imageUrl: 'assets/products/IMG_3931.JPG',
      images: ['assets/products/IMG_3931.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3959.JPG',
      images: ['assets/products/IMG_3959.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_4054.JPG',
      images: ['assets/products/IMG_4054.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      originalPrice: 290,
      categoryId: 4, // Photographie
      tags: ['photo', 'promo'],
      imageUrl: 'assets/products/IMG_5378.JPG',
      images: ['assets/products/IMG_5378.JPG', 'assets/products/IMG_5378.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
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
      categoryId: 4, // Photographie
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_6034.JPG',
      images: ['assets/products/IMG_6034.JPG'],
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 112,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-08'),
      updatedAt: new Date('2024-03-08'),
    },
    {
      id: 15,
      title: 'Fraisier',
      description: 'Croquis de fraises réalisé au crayon graphite sur papier texturé.',
      price: 90,
      categoryId: 1, // Dessin
      tags: ['dessin', 'graphite', 'étude'],
      imageUrl: 'assets/products/fraisier.png',
      images: ['assets/products/fraisier.png'],
      technique: 'Crayon graphite 2B sur papier 180g',
      dimensions: { width: 21, height: 29.7, unit: 'cm' },
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
      categoryId: 1, // Dessin
      tags: ['dessin', 'encre', 'nature'],
      imageUrl: 'assets/products/tiger.JPG',
      images: ['assets/products/tiger.JPG'],
      technique: 'Encre & lavis sur papier coton',
      dimensions: { width: 30, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 62,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-02'),
      updatedAt: new Date('2024-03-04'),
    },
    {
      id: 17,
      title: 'Desert de sable',
      description: 'Desert du sahara, contrastes profonds et gestes vifs.',
      price: 220,
      categoryId: 1, // Dessin
      tags: ['dessin', 'fusain', 'portrait'],
      imageUrl: 'assets/products/desert.JPG',
      images: ['assets/products/desert.JPG'],
      technique: 'Fusain sur papier 200g',
      dimensions: { width: 35, height: 50, unit: 'cm' },
      isAvailable: true,
      stock: 27,
      isLimitedEdition: true,
      createdAt: new Date('2024-03-12'),
      updatedAt: new Date('2024-03-12'),
    },
  ]);

  // ===== Utils

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===== Queries (APIs publiques)

  /** Nouvelle API (préférée) */
  async getAll(): Promise<Product[]> {
    await this.delay(300);
    return [...this.products()];
  }

  /** Ancienne API conservée pour compatibilité */
  async getAllProducts(): Promise<Product[]> {
    return this.getAll();
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.delay(200);
    const product = this.products().find((p) => p.id === id);
    return product ?? null;
  }

  /** Lookup public : ne renvoie le produit que s'il est disponible */
  async getPublicProductById(id: number): Promise<Product | null> {
    const p = await this.getProductById(id);
    return p && p.isAvailable ? p : null;
  }

  /** (Optionnel) liste publique uniquement disponible */
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
        if (a.originalPrice && !b.originalPrice) return -1;
        if (!a.originalPrice && b.originalPrice) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);

    return products;
  }

  /**
   * Récupère les produits créés dans une plage de dates
   */
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
    } catch (error) {
      console.error('Erreur lors de la récupération des produits par date:', error);
      // Fallback: retourner les produits récents
      return this.getFeaturedProducts(limit);
    }
  }

  /**
   * Récupère les produits récents (créés dans les 30 derniers jours)
   */
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

      // Si pas assez de produits récents, compléter avec les plus récents
      if (recent.length < limit) {
        const additional = this.products()
          .filter((p) => p.isAvailable && !recent.includes(p))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit - recent.length);

        recent.push(...additional);
      }

      return recent;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits récents:', error);
      return this.getFeaturedProducts(limit);
    }
  }

  /**
   * Récupère les produits en promotion
   */
  async getPromotionProducts(limit = 8): Promise<Product[]> {
    await this.delay(200);
    try {
      const promotions = this.products()
        .filter((p) => p.originalPrice && p.originalPrice > p.price && p.isAvailable)
        .sort((a, b) => {
          const discountA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
          const discountB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
          return discountB - discountA; // Tri par pourcentage décroissant
        })
        .slice(0, limit);

      return promotions;
    } catch (error) {
      console.error('Erreur lors de la récupération des promotions:', error);
      // Fallback: simuler des promotions sur les produits featured
      const featured = await this.getFeaturedProducts(limit);
      return featured.map((product) => ({
        ...product,
        originalPrice: Math.round(product.price * 1.25), // Prix original fictif (+25%)
        price: Math.round(product.price * 0.85), // Prix réduit (-15%)
      }));
    }
  }

  /**
   * Récupère les produits par catégorie
   */
  async getProductsByCategory(categoryId: number, limit = 10): Promise<Product[]> {
    await this.delay(200);
    try {
      const filtered = this.products()
        .filter((p) => p.categoryId === categoryId && p.isAvailable)
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, limit);

      return filtered;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits par catégorie:', error);
      return [];
    }
  }

  /**
   * Récupère des produits aléatoires pour le carrousel général
   */
  async getRandomProducts(limit = 12): Promise<Product[]> {
    await this.delay(200);
    try {
      const available = this.products().filter((p) => p.isAvailable);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const random = shuffled.slice(0, limit);

      return random;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits aléatoires:', error);
      return this.getFeaturedProducts(limit);
    }
  }

  /**
   * Nouvelle API de filtre (sans artistes).
   * Gère: search, categoryId, categorySlug, minPrice, maxPrice, technique, isAvailable.
   */
  async filterProducts(filters: ProductFilter): Promise<Product[]> {
    await this.delay(300);
    let filtered = this.products();

    // disponibilité (si fourni)
    if (typeof filters.isAvailable === 'boolean') {
      filtered = filtered.filter((p) => p.isAvailable === filters.isAvailable);
    } else {
      filtered = filtered.filter((p) => p.isAvailable);
    }

    // catégorie par id
    if (typeof filters.categoryId === 'number') {
      filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
    }

    // catégorie par slug
    if (filters.categorySlug) {
      const cats = await this.categoryService.getAll();
      const cat = cats.find((c) => c.slug.toLowerCase() === filters.categorySlug!.toLowerCase());
      filtered = cat ? filtered.filter((p) => p.categoryId === cat.id) : [];
    }

    // min/max price
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

    // recherche globale (sans artiste)
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

    // Produits DISPONIBLES uniquement
    const seenProductIds = new Set<number>();
    for (const p of products) {
      if (!p.isAvailable) continue; // 🔒 filtre clé
      if (
        (p.title.toLowerCase().includes(q) || String(p.id).includes(q)) &&
        !seenProductIds.has(p.id)
      ) {
        results.push({ type: 'product', label: p.title, value: String(p.id), image: p.imageUrl });
        seenProductIds.add(p.id);
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    // Tags (uniques) issus des produits disponibles
    const uniqueTags = [...new Set(products.filter((p) => p.isAvailable).flatMap((p) => p.tags))];
    for (const t of uniqueTags) {
      if (t.toLowerCase().includes(q)) {
        results.push({ type: 'tag', label: t, value: t });
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    return results.slice(0, limit);
  }

  // ===== Mutations

  async updateProductAvailability(id: number, isAvailable: boolean): Promise<void> {
    await this.delay(300);
    const list = this.products();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Produit avec l'id ${id} introuvable`);

    const next = [...list];
    next[idx] = { ...next[idx], isAvailable, updatedAt: new Date() };
    this.products.set(next);
  }

  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    await this.delay(300);
    const list = this.products();
    const newId = (list.length ? Math.max(...list.map((p) => p.id)) : 0) + 1;

    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    // détacher de l'ancienne catégorie si besoin
    const prev = cats.find((c) => (c.productIds ?? []).includes(productId));
    if (prev) {
      await this.categoryService.detachProducts(prev.id, [productId]);
    }

    // attacher à la nouvelle si fournie
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

    const updated: Product = { ...list[idx], ...patch, id, updatedAt: new Date() };
    const next = [...list];
    next[idx] = updated;
    this.products.set(next);

    return updated;
  }

  async updateProductStock(id: number, newStock: number): Promise<void> {
    await this.delay(200);
    if (newStock < 0) throw new Error('Le stock ne peut pas être négatif');

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
}
