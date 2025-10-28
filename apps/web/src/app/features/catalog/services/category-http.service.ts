import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryHttpService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/categories';

  /**
   * GET ALL CATEGORIES - Récupérer toutes les catégories
   */
  async getAll(): Promise<Category[]> {
    try {
      return await firstValueFrom(
        this.http.get<Category[]>(this.API_URL)
      );
    } catch {
      return [];
    }
  }

  /**
   * GET ROOT CATEGORIES - Récupérer les catégories racines
   */
  async getRootCategories(): Promise<Category[]> {
    try {
      return await firstValueFrom(
        this.http.get<Category[]>(`${this.API_URL}/root`)
      );
    } catch {
      return [];
    }
  }

  /**
   * GET CATEGORY BY ID - Récupérer une catégorie par ID
   */
  async getById(id: number): Promise<Category | null> {
    try {
      return await firstValueFrom(
        this.http.get<Category>(`${this.API_URL}/${id}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * GET CATEGORY BY SLUG - Récupérer une catégorie par slug
   */
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      return await firstValueFrom(
        this.http.get<Category>(`${this.API_URL}/slug/${slug}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * CREATE CATEGORY - Créer une nouvelle catégorie (admin)
   */
  async create(category: Partial<Category>): Promise<Category | null> {
    try {
      return await firstValueFrom(
        this.http.post<Category>(this.API_URL, category)
      );
    } catch (error: any) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  /**
   * UPDATE CATEGORY - Mettre à jour une catégorie (admin)
   */
  async update(id: number, updates: Partial<Category>): Promise<Category | null> {
    try {
      return await firstValueFrom(
        this.http.patch<Category>(`${this.API_URL}/${id}`, updates)
      );
    } catch (error: any) {
      console.error('Error updating category:', error);
      return null;
    }
  }

  /**
   * DELETE CATEGORY - Supprimer une catégorie (admin)
   */
  async delete(id: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${id}`)
      );
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  /**
   * GET CATEGORY TREE - Construire l'arbre des catégories
   */
  async getCategoryTree(): Promise<Category[]> {
    const allCategories = await this.getAll();
    return this.buildTree(allCategories);
  }

  /**
   * BUILD TREE - Construire l'arbre hiérarchique
   */
  private buildTree(categories: Category[], parentId: number | null = null): Category[] {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildTree(categories, cat.id)
      }));
  }

  /**
   * GET COUNT - Nombre de catégories
   */
  async getCount(): Promise<number> {
    const categories = await this.getAll();
    return categories.length;
  }

  /**
   * CREATE SUBCATEGORY - Créer une sous-catégorie
   */
  async createSubCategory(parentId: number, subCategory: Partial<Category>): Promise<Category | null> {
    return this.create({ ...subCategory, parentId });
  }

  /**
   * UPDATE SUBCATEGORY - Mettre à jour une sous-catégorie
   */
  async updateSubCategory(parentId: number, subCategoryId: number, updates: Partial<Category>): Promise<Category | null> {
    return this.update(subCategoryId, updates);
  }

  /**
   * REMOVE SUBCATEGORY - Supprimer une sous-catégorie
   */
  async removeSubCategory(parentId: number, subCategoryId: number): Promise<boolean> {
    return this.delete(subCategoryId);
  }

  /**
   * GET BANNER URL - URL de la bannière d'une catégorie
   */
  getBannerUrl(category: Category | null): string {
    if (!category || !category.bannerImage) {
      return this.getDefaultBannerUrl();
    }
    return category.bannerImage;
  }

  /**
   * GET DEFAULT BANNER URL - URL de bannière par défaut
   */
  getDefaultBannerUrl(): string {
    return '/assets/default-banner.jpg';
  }

  /**
   * REMOVE - Alias pour delete() pour compatibilité
   */
  async remove(id: number): Promise<boolean> {
    return this.delete(id);
  }
}
