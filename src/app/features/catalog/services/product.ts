import { Injectable, signal, inject, Injector } from '@angular/core';
import { Product, ProductCategory, ProductFilter } from '../models/product.model';
import { ArtistService } from './artist';

export interface QuickSuggestion {
  type: 'product' | 'artist' | 'tag';
  label: string;
  value: string;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly artistService = inject(ArtistService);

  private products = signal<Product[]>([
    {
      id: 1,
      title: 'Paysage Urbain au Crépuscule',
      description:
        'Une vue impressionnante de la ville au coucher du soleil, capturant les jeux de lumière entre les bâtiments modernes.',
      price: 450,
      originalPrice: 500,
      category: ProductCategory.PAINTING,
      tags: ['urbain', 'crépuscule', 'moderne', 'architecture'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519681393784-d120c3b4fd18?w=800&h=600&fit=crop',
      ],
      artistId: 1, // Référence à l'artiste Matthéo Naegellen
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
      category: ProductCategory.DRAWING,
      tags: ['portrait', 'expressif', 'émotion', 'visage'],
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'],
      artistId: 2, // Référence à Jean-Pierre Moreau
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
      category: ProductCategory.DIGITAL_ART,
      tags: ['abstrait', 'coloré', 'géométrique', 'moderne'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop'],
      artistId: 3, // Référence à Capucine Henry
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
      category: ProductCategory.PAINTING,
      tags: ['nature morte', 'classique', 'lumière', 'tradition'],
      imageUrl: 'assets/products/IMG_6265.JPG',
      images: ['assets/products/IMG_6265.JPG'],
      artistId: 4, // Référence à Antoine Roux
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['paysage', 'montagne', 'nature', 'panoramique'],
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
      artistId: 5, // Référence à Claire Beaumont
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
      category: ProductCategory.DRAWING,
      tags: ['esquisse', 'urbain', 'croquis', 'mouvement'],
      imageUrl: 'assets/products/IMG_6264.JPG',
      images: ['assets/products/IMG_6264.JPG'],
      artistId: 1, // Référence à Matthéo Naegellen
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original', 'collection'],
      imageUrl: 'assets/products/IMG_3900.JPG',
      images: ['assets/products/IMG_3900.JPG'],
      artistId: 1, // Référence à Matthéo Naegellen
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3927.JPG',
      images: ['assets/products/IMG_3927.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_3930.JPG',
      images: ['assets/products/IMG_3930.JPG'],
      artistId: 1, // Référence à Matthéo Naegellen
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'édition'],
      imageUrl: 'assets/products/IMG_3931.JPG',
      images: ['assets/products/IMG_3931.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3959.JPG',
      images: ['assets/products/IMG_3959.JPG'],
      artistId: 1, // Référence à Matthéo Naegellen
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_4054.JPG',
      images: ['assets/products/IMG_4054.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'promo'],
      imageUrl: 'assets/products/IMG_5378.JPG',
      images: ['assets/products/IMG_5378.JPG', 'assets/products/IMG_5378.JPG'],
      artistId: 1, // Référence à Matthéo Naegellen
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
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_6034.JPG',
      images: ['assets/products/IMG_6034.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.DRAWING,
      tags: ['dessin', 'graphite', 'étude'],
      imageUrl: 'assets/products/fraisier.png',
      images: ['assets/products/fraisier.png'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.DRAWING,
      tags: ['dessin', 'encre', 'nature'],
      imageUrl: 'assets/products/tiger.JPG',
      images: ['assets/products/tiger.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
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
      category: ProductCategory.DRAWING,
      tags: ['dessin', 'fusain', 'portrait'],
      imageUrl: 'assets/products/desert.JPG',
      images: ['assets/products/desert.JPG'],
      artistId: 1002, // Référence à Capucine Henry (id 1002)
      technique: 'Fusain sur papier 200g',
      dimensions: { width: 35, height: 50, unit: 'cm' },
      isAvailable: true,
      stock: 27,
      isLimitedEdition: true,
      createdAt: new Date('2024-03-12'),
      updatedAt: new Date('2024-03-12'),
    },
  ]);

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private readonly injector = inject(Injector);
  private async resolveArtists(products: Product[]): Promise<Product[]> {
    const allArtists = await this.artistService.getAll();
    const byId = new Map(allArtists.map((a) => [a.id, a]));
    return products.map((product) => ({
      ...product,
      artist: product.artist ?? byId.get(product.artistId) ?? undefined,
    }));
  }

  async getAllProducts(): Promise<Product[]> {
    await this.delay(300);
    const products = [...this.products()];
    return this.resolveArtists(products);
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.delay(200);
    const product = this.products().find((p) => p.id === id);
    if (!product) return null;

    const resolvedProducts = await this.resolveArtists([product]);
    return resolvedProducts[0];
  }

  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    await this.delay(250);
    const products = this.products().filter((p) => p.category === category);
    return this.resolveArtists(products);
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

    return this.resolveArtists(products);
  }

  async searchProducts(filters: ProductFilter): Promise<Product[]> {
    await this.delay(300);
    let filtered = this.products().filter((p) => p.isAvailable);

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    // Pour la recherche par artiste, on doit d'abord résoudre les artistes
    if (filters.artist) {
      const resolvedProducts = await this.resolveArtists(filtered);
      filtered = resolvedProducts.filter((p) =>
        (typeof p.artist === 'object' ? p.artist.name : String(p.artist))
          .toLowerCase()
          .includes(filters.artist!.toLowerCase())
      );
      // Retourne directement car déjà résolu
      return this.applyRemainingFilters(filtered, filters);
    }

    if (filters.technique) {
      filtered = filtered.filter((p) =>
        p.technique.toLowerCase().includes(filters.technique!.toLowerCase())
      );
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const resolvedProducts = await this.resolveArtists(filtered);
      filtered = resolvedProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          (typeof p.artist === 'object' ? p.artist.name : String(p.artist))
            .toLowerCase()
            .includes(searchTerm)
      );
      return filtered;
    }

    return this.resolveArtists(filtered);
  }

  private applyRemainingFilters(products: Product[], filters: ProductFilter): Product[] {
    let filtered = products;

    if (filters.technique) {
      filtered = filtered.filter((p) =>
        p.technique.toLowerCase().includes(filters.technique!.toLowerCase())
      );
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          (typeof p.artist === 'object' ? p.artist.name : String(p.artist))
            .toLowerCase()
            .includes(searchTerm)
      );
    }

    return filtered;
  }

  getCategories(): ProductCategory[] {
    return Object.values(ProductCategory);
  }

  getCategoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
      [ProductCategory.DRAWING]: 'Dessins',
      [ProductCategory.PAINTING]: 'Peintures',
      [ProductCategory.DIGITAL_ART]: 'Art Numérique',
      [ProductCategory.PHOTOGRAPHY]: 'Photographie',
      [ProductCategory.SCULPTURE]: 'Sculptures',
      [ProductCategory.MIXED_MEDIA]: 'Médias Mixtes',
    };
    return labels[category];
  }

  /** ====== NOUVEAU : comptages par catégorie ====== */

  /** Version synchrone instantanée (utile dans des signals/effets) */
  getCategoryCountsSync(): Record<ProductCategory, number> {
    const counts = {} as Record<ProductCategory, number>;
    for (const cat of this.getCategories()) counts[cat] = 0;
    for (const p of this.products()) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }

  /** Version asynchrone avec petit délai (cohérent avec le reste du service) */
  async getCategoryCounts(): Promise<Record<ProductCategory, number>> {
    await this.delay(150);
    return this.getCategoryCountsSync();
  }

  /** Nombre pour une catégorie donnée */
  async getCountFor(category: ProductCategory): Promise<number> {
    await this.delay(120);
    return this.products().filter((p) => p.category === category).length;
  }

  async quickSearchSuggestions(term: string, limit = 6): Promise<QuickSuggestion[]> {
    const q = term.trim().toLowerCase();
    if (!q) return [];

    const results: QuickSuggestion[] = [];
    const products = await this.resolveArtists(this.products());

    // --- Produits (unique par id)
    const seenProductIds = new Set<number>();
    for (const p of products) {
      if (p.title.toLowerCase().includes(q) && !seenProductIds.has(p.id)) {
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

    // --- Artistes (unique par nom)
    const seenArtistNames = new Set<string>();
    for (const p of products) {
      const name = typeof p.artist === 'object' ? p.artist.name : String(p.artist);
      const image = typeof p.artist === 'object' ? p.artist.profileImage : undefined;
      if (name.toLowerCase().includes(q) && !seenArtistNames.has(name)) {
        results.push({
          type: 'artist',
          label: name,
          value: name,
          image: image,
        });
        seenArtistNames.add(name);
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    // --- Tags (déjà uniques via Set)
    const uniqueTags = [...new Set(products.flatMap((p) => p.tags))];
    for (const t of uniqueTags) {
      if (t.toLowerCase().includes(q)) {
        results.push({ type: 'tag', label: t, value: t });
        if (results.length >= limit) return results.slice(0, limit);
      }
    }

    // Limite globale (au cas où)
    return results.slice(0, limit);
  }

  /**
   * Met à jour la disponibilité d'un produit
   */
  async updateProductAvailability(id: number, isAvailable: boolean): Promise<void> {
    await this.delay(300);

    const products = this.products();
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      throw new Error(`Produit avec l'id ${id} introuvable`);
    }

    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      isAvailable,
      updatedAt: new Date(),
    };

    this.products.set(updatedProducts);
  }

  /**
   * Supprime un produit
   */
  async deleteProduct(id: number): Promise<void> {
    await this.delay(200);

    const products = this.products();
    const productExists = products.find((p) => p.id === id);

    if (!productExists) {
      throw new Error(`Produit avec l'id ${id} introuvable`);
    }

    const filteredProducts = products.filter((p) => p.id !== id);
    this.products.set(filteredProducts);
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    await this.delay(300);

    const products = this.products();
    const newId = Math.max(...products.map((p) => p.id)) + 1;

    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set([...products, newProduct]);

    // Retourne le produit avec l'artiste résolu
    const resolvedProducts = await this.resolveArtists([newProduct]);
    return resolvedProducts[0];
  }

  /**
   * Met à jour un produit existant
   */
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    await this.delay(300);

    const products = this.products();
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      throw new Error(`Produit avec l'id ${id} introuvable`);
    }

    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      ...productData,
      id, // Préserve l'ID original
      updatedAt: new Date(),
    };

    this.products.set(updatedProducts);

    // Retourne le produit avec l'artiste résolu
    const resolvedProducts = await this.resolveArtists([updatedProducts[productIndex]]);
    return resolvedProducts[0];
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateProductStock(id: number, newStock: number): Promise<void> {
    await this.delay(200);

    if (newStock < 0) {
      throw new Error('Le stock ne peut pas être négatif');
    }

    await this.updateProduct(id, {
      stock: newStock,
      isAvailable: newStock > 0, // Auto-désactivation si stock à 0
    });
  }

  /**
   * Obtient les statistiques des produits pour l'admin
   */
  async getProductStats(): Promise<{
    total: number;
    available: number;
    unavailable: number;
    limitedEdition: number;
    averagePrice: number;
    totalValue: number;
  }> {
    await this.delay(150);

    const products = this.products();
    const available = products.filter((p) => p.isAvailable).length;
    const unavailable = products.length - available;
    const limitedEdition = products.filter((p) => p.isLimitedEdition).length;
    const averagePrice =
      products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    return {
      total: products.length,
      available,
      unavailable,
      limitedEdition,
      averagePrice,
      totalValue,
    };
  }

  countProductsByArtist(artistId: number): number {
    return this.products().filter((p) => (p.artist?.id ?? p.artistId) === artistId).length;
  }

  async getProductsByArtist(artistId: number): Promise<Product[]> {
    const products = this.products().filter((p) => (p.artist?.id ?? p.artistId) === artistId);
    return this.resolveArtists(products);
  }
}
