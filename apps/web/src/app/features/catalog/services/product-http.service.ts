import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product, ProductVariant } from '../models/product.model';

export interface SearchSuggestion {
  type: 'product';
  label: string;
  value: number;
  image: string | null;
  data: Product;
}

export interface ProductFilter {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  hasPromotion?: boolean;
  isAvailable?: boolean;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductHttpService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/products';

  /**
   * GET ALL PRODUCTS - Récupérer tous les produits
   */
  async getAll(): Promise<Product[]> {
    try {
      return await firstValueFrom(
        this.http.get<Product[]>(this.API_URL)
      );
    } catch {
      return [];
    }
  }

  /**
   * GET PRODUCT BY ID - Récupérer un produit par ID
   */
  async getById(id: number): Promise<Product | null> {
    try {
      return await firstValueFrom(
        this.http.get<Product>(`${this.API_URL}/${id}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * GET PRODUCT BY SLUG - Récupérer un produit par slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    try {
      return await firstValueFrom(
        this.http.get<Product>(`${this.API_URL}/slug/${slug}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * GET PRODUCTS BY CATEGORY - Récupérer les produits d'une catégorie
   */
  async getByCategory(categoryId: number): Promise<Product[]> {
    try {
      return await firstValueFrom(
        this.http.get<Product[]>(`${this.API_URL}?categoryId=${categoryId}`)
      );
    } catch {
      return [];
    }
  }

  /**
   * CREATE PRODUCT - Créer un nouveau produit (admin)
   */
  async create(product: Partial<Product>): Promise<Product | null> {
    try {
      return await firstValueFrom(
        this.http.post<Product>(this.API_URL, product)
      );
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      return null;
    }
  }

  /**
   * UPDATE PRODUCT - Mettre à jour un produit (admin)
   */
  async update(id: number, updates: Partial<Product>): Promise<Product | null> {
    try {
      return await firstValueFrom(
        this.http.patch<Product>(`${this.API_URL}/${id}`, updates)
      );
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      return null;
    }
  }

  /**
   * DELETE PRODUCT - Supprimer un produit (admin)
   */
  async delete(id: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${id}`)
      );
      return true;
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  /**
   * SEARCH PRODUCTS - Rechercher des produits
   */
  async search(query: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAll();
      const lowerQuery = query.toLowerCase();
      return allProducts.filter(p =>
        (p.name || p.title).toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      );
    } catch {
      return [];
    }
  }

  /**
   * GET CATEGORY COUNTS - Nombre de produits par catégorie
   */
  async getCategoryCounts(): Promise<Record<number, number>> {
    const products = await this.getAll();
    const counts: Record<number, number> = {};

    products.forEach(p => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });

    return counts;
  }

  /**
   * GET SUB-CATEGORY COUNTS - Nombre de produits par sous-catégorie
   */
  async getSubCategoryCounts(): Promise<Record<number, number>> {
    return this.getCategoryCounts();
  }

  /**
   * GET FEATURED PRODUCTS - Produits mis en avant
   */
  async getFeaturedProducts(limit: number = 20): Promise<Product[]> {
    const products = await this.getAll();
    return products.slice(0, limit);
  }

  /**
   * QUICK SEARCH SUGGESTIONS - Suggestions de recherche rapide
   */
  async quickSearchSuggestions(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    const results = await this.search(query);
    return results.slice(0, limit).map(p => ({
      type: 'product' as const,
      label: p.name || p.title,
      value: p.id,
      image: p.imageUrl ?? null,
      data: p
    }));
  }

  /**
   * GET PRODUCTS BY DATE RANGE - Produits dans une plage de dates
   */
  async getProductsByDateRange(startDate: Date, endDate: Date): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  /**
   * GET RECENT PRODUCTS - Produits récents
   */
  async getRecentProducts(limit: number = 12): Promise<Product[]> {
    const products = await this.getAll();
    return products
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * GET PROMOTION PRODUCTS - Produits en promotion
   */
  async getPromotionProducts(limit: number = 12): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.hasPromotion || (p.discount ?? 0) > 0).slice(0, limit);
  }

  /**
   * GET VARIANT BY ID - Récupérer une variante spécifique
   */
  async getVariantById(productId: number, variantId: number): Promise<ProductVariant | null> {
    const product = await this.getById(productId);
    if (!product || !product.variants) return null;
    return product.variants.find(v => v.id === variantId) || null;
  }

  /**
   * FILTER PRODUCTS - Filtrer les produits selon des critères
   */
  async filterProducts(filter: ProductFilter): Promise<Product[]> {
    let products = await this.getAll();

    if (filter.categoryId) {
      products = products.filter(p => p.categoryId === filter.categoryId);
    }
    if (filter.minPrice !== undefined) {
      products = products.filter(p => p.originalPrice >= filter.minPrice!);
    }
    if (filter.maxPrice !== undefined) {
      products = products.filter(p => p.originalPrice <= filter.maxPrice!);
    }
    if (filter.tags && filter.tags.length > 0) {
      products = products.filter(p =>
        filter.tags!.some((tag: string) => p.tags.includes(tag))
      );
    }

    return products;
  }

  /**
   * UPDATE PRODUCT - Mettre à jour un produit
   */
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    return this.update(id, updates);
  }

  /**
   * UPDATE VARIANT STOCK - Mettre à jour le stock d'une variante
   */
  async updateVariantStock(productId: number, variantId: number, newStock: number): Promise<boolean> {
    const product = await this.getById(productId);
    if (!product || !product.variants) return false;

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.stock = newStock;
    const updated = await this.update(productId, product);
    return !!updated;
  }

  /**
   * UPDATE PRODUCT AVAILABILITY - Mettre à jour la disponibilité d'un produit
   */
  async updateProductAvailability(id: number, isAvailable: boolean): Promise<Product | null> {
    return this.update(id, { isAvailable });
  }

  /**
   * DELETE PRODUCT - Supprimer un produit
   */
  async deleteProduct(id: number): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * Alias pour compatibilité avec l'ancien ProductService
   */
  getAllProducts = () => this.getAll();
  getProductById = (id: number) => this.getById(id);
  getProductBySlug = (slug: string) => this.getBySlug(slug);
  getPublicProductById = (id: number) => this.getById(id);
  getProductsByCategory = (categoryId: number) => this.getByCategory(categoryId);
  getProductsByCategoryId = (categoryId: number) => this.getByCategory(categoryId);
}
