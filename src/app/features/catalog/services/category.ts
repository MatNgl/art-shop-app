import { Injectable, signal } from '@angular/core';
import { Category, SubCategory } from '../models/category.model';

export type { Category, SubCategory } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  /**
   * Catégories avec sous-catégories seedées
   * Exemple: Dessin (Fusain, Crayon, Encre), Peinture (Huile, Acrylique, Aquarelle), etc.
   */
  private readonly _categories = signal<Category[]>([
    {
      id: 1,
      name: 'Dessin',
      slug: 'dessin',
      description: 'Crayons, fusain, encre, pastels…',
      color: '#f59e0b',
      icon: 'fa-pencil',
      image: 'https://images.unsplash.com/photo-1513569771920-c9e1d31714af?w=1200',
      isActive: true,
      productIds: [],
      subCategories: [
        {
          id: 101,
          name: 'Fusain',
          slug: 'fusain',
          description: 'Dessins au fusain',
          parentCategoryId: 1,
          productIds: [3], // Abstraction Colorée
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 102,
          name: 'Crayon',
          slug: 'crayon',
          description: 'Dessins au crayon graphite',
          parentCategoryId: 1,
          productIds: [5, 16], // Paysage Montagnard, Baignade de tigres
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 103,
          name: 'Encre',
          slug: 'encre',
          description: 'Dessins à l\'encre',
          parentCategoryId: 1,
          productIds: [6, 10], // Esquisse Urbaine, Nature morte aux citrons
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 104,
          name: 'Pastel',
          slug: 'pastel',
          description: 'Dessins au pastel',
          parentCategoryId: 1,
          productIds: [], // Aucun pour le moment
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Peinture',
      slug: 'peinture',
      description: 'Œuvres de peinture traditionnelle et contemporaine.',
      color: '#3b82f6',
      icon: 'fa-palette',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200',
      isActive: true,
      productIds: [],
      subCategories: [
        {
          id: 201,
          name: 'Huile',
          slug: 'huile',
          description: 'Peinture à l\'huile',
          parentCategoryId: 2,
          productIds: [8, 14], // Fleur dans son vase, Anémone ivoire
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 202,
          name: 'Acrylique',
          slug: 'acrylique',
          description: 'Peinture acrylique',
          parentCategoryId: 2,
          productIds: [7, 11], // Crevette, Crépuscule sur le rivage
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 203,
          name: 'Aquarelle',
          slug: 'aquarelle',
          description: 'Peinture aquarelle',
          parentCategoryId: 2,
          productIds: [4, 9, 12], // Nature Morte Classique, Nénu, Ciel sur la cathédrale
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Art numérique',
      slug: 'art-numerique',
      description: 'Illustrations et compositions digitales.',
      color: '#a21caf',
      icon: 'fa-microchip',
      image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200',
      isActive: true,
      productIds: [],
      subCategories: [
        {
          id: 301,
          name: 'Illustration 2D',
          slug: 'illustration-2d',
          description: 'Illustrations digitales 2D',
          parentCategoryId: 3,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 302,
          name: '3D',
          slug: '3d',
          description: 'Art 3D et modélisation',
          parentCategoryId: 3,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 303,
          name: 'Pixel Art',
          slug: 'pixel-art',
          description: 'Art en pixels',
          parentCategoryId: 3,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      name: 'Photographie',
      slug: 'photographie',
      description: 'Tirages et séries photo.',
      color: '#10b981',
      icon: 'fa-camera',
      image: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200',
      isActive: true,
      productIds: [],
      subCategories: [
        {
          id: 401,
          name: 'Portrait',
          slug: 'portrait',
          description: 'Photographies de portraits',
          parentCategoryId: 4,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 402,
          name: 'Paysage',
          slug: 'paysage',
          description: 'Photographies de paysages',
          parentCategoryId: 4,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 403,
          name: 'Urbain',
          slug: 'urbain',
          description: 'Photographie urbaine',
          parentCategoryId: 4,
          productIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // --- Queries Categories
  async getAll(): Promise<Category[]> {
    await this.delay(120);
    return [...this._categories()];
  }

  async getById(id: number): Promise<Category | null> {
    await this.delay(80);
    return this._categories().find((c) => c.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    await this.delay(60);
    const s = slug.trim().toLowerCase();
    if (!s) return null;
    return this._categories().find((c) => c.slug.toLowerCase() === s) ?? null;
  }

  async search(term: string): Promise<Category[]> {
    await this.delay(60);
    const q = term.trim().toLowerCase();
    if (!q) return this.getAll();
    return this._categories().filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }

  async getCount(): Promise<number> {
    await this.delay(10);
    return this._categories().length;
  }

  getCategoryLabel(id?: number): string {
    if (id === null || id === undefined) return '—';
    return this._categories().find((c) => c.id === id)?.name ?? '—';
  }

  // --- Queries SubCategories
  async getSubCategoryById(subCategoryId: number): Promise<SubCategory | null> {
    await this.delay(60);
    for (const cat of this._categories()) {
      const sub = cat.subCategories?.find((s) => s.id === subCategoryId);
      if (sub) return sub;
    }
    return null;
  }

  async getSubCategoryBySlug(
    categorySlug: string,
    subCategorySlug: string
  ): Promise<SubCategory | null> {
    await this.delay(60);
    const cat = await this.getBySlug(categorySlug);
    if (!cat) return null;
    return cat.subCategories?.find((s) => s.slug === subCategorySlug) ?? null;
  }

  async getSubCategoriesByCategory(categoryId: number): Promise<SubCategory[]> {
    await this.delay(60);
    const cat = await this.getById(categoryId);
    return cat?.subCategories ?? [];
  }

  getSubCategoryLabel(id?: number): string {
    if (id === null || id === undefined) return '—';
    for (const cat of this._categories()) {
      const sub = cat.subCategories?.find((s) => s.id === id);
      if (sub) return sub.name;
    }
    return '—';
  }

  // --- Utilisé par le widget du dashboard
  async getAllWithCounts(): Promise<
    { key: string; label: string; count: number; icon: string; colorClass: string }[]
  > {
    const cats = await this.getAll();

    const colorMap: Record<string, string> = {
      dessin: 'text-amber-600',
      peinture: 'text-blue-600',
      'art-numerique': 'text-fuchsia-600',
      photographie: 'text-emerald-600',
      sculpture: 'text-orange-600',
      'mixed-media': 'text-violet-600',
    };

    return cats.map((c) => ({
      key: c.slug,
      label: c.name,
      count: c.productIds?.length ?? 0,
      icon: c.icon || 'fa-tags',
      colorClass: colorMap[c.slug] || 'text-slate-600',
    }));
  }

  // --- Mutations Categories
  async create(payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    await this.delay(150);
    const list = this._categories();
    const nextId = list.length ? Math.max(...list.map((c) => c.id)) + 1 : 1;
    const now = new Date().toISOString();
    const created: Category = {
      id: nextId,
      createdAt: now,
      updatedAt: now,
      subCategories: [],
      ...payload,
    };
    this._categories.set([created, ...list]);
    return created;
  }

  async update(id: number, patch: Partial<Category>): Promise<Category> {
    await this.delay(150);
    const list = this._categories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Catégorie introuvable');
    const updated: Category = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
    const next = [...list];
    next[idx] = updated;
    this._categories.set(next);
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.delay(120);
    const list = this._categories().filter((c) => c.id !== id);
    this._categories.set(list);
  }

  async attachProducts(id: number, productIds: number[]): Promise<Category> {
    await this.delay(120);
    const cat = await this.getById(id);
    if (!cat) throw new Error('Catégorie introuvable');
    const set = new Set([...(cat.productIds ?? []), ...productIds]);
    return this.update(id, { productIds: Array.from(set) });
  }

  async detachProducts(id: number, productIds: number[]): Promise<Category> {
    await this.delay(120);
    const cat = await this.getById(id);
    if (!cat) throw new Error('Catégorie introuvable');
    const keep = (cat.productIds ?? []).filter((pid) => !productIds.includes(pid));
    return this.update(id, { productIds: keep });
  }

  // --- Mutations SubCategories
  async createSubCategory(
    categoryId: number,
    payload: Omit<SubCategory, 'id' | 'parentCategoryId' | 'createdAt' | 'updatedAt'>
  ): Promise<SubCategory> {
    await this.delay(150);
    const cat = await this.getById(categoryId);
    if (!cat) throw new Error('Catégorie introuvable');

    const allSubIds: number[] = [];
    for (const c of this._categories()) {
      if (c.subCategories) allSubIds.push(...c.subCategories.map((s) => s.id));
    }
    const nextId = allSubIds.length ? Math.max(...allSubIds) + 1 : 100;

    const now = new Date().toISOString();
    const created: SubCategory = {
      id: nextId,
      parentCategoryId: categoryId,
      createdAt: now,
      updatedAt: now,
      productIds: [],
      ...payload,
    };

    const updated = {
      ...cat,
      subCategories: [...(cat.subCategories ?? []), created],
      updatedAt: now,
    };

    await this.update(categoryId, updated);
    return created;
  }

  async updateSubCategory(
    categoryId: number,
    subCategoryId: number,
    patch: Partial<SubCategory>
  ): Promise<SubCategory> {
    await this.delay(150);
    const cat = await this.getById(categoryId);
    if (!cat) throw new Error('Catégorie introuvable');

    const idx = (cat.subCategories ?? []).findIndex((s) => s.id === subCategoryId);
    if (idx < 0) throw new Error('Sous-catégorie introuvable');

    const now = new Date().toISOString();
    const updated: SubCategory = {
      ...cat.subCategories![idx],
      ...patch,
      id: subCategoryId,
      parentCategoryId: categoryId,
      updatedAt: now,
    };

    const newSubs = [...(cat.subCategories ?? [])];
    newSubs[idx] = updated;

    await this.update(categoryId, { subCategories: newSubs });
    return updated;
  }

  async removeSubCategory(categoryId: number, subCategoryId: number): Promise<void> {
    await this.delay(120);
    const cat = await this.getById(categoryId);
    if (!cat) throw new Error('Catégorie introuvable');

    const newSubs = (cat.subCategories ?? []).filter((s) => s.id !== subCategoryId);
    await this.update(categoryId, { subCategories: newSubs });
  }

  async attachProductsToSubCategory(
    categoryId: number,
    subCategoryId: number,
    productIds: number[]
  ): Promise<SubCategory> {
    const cat = await this.getById(categoryId);
    if (!cat) throw new Error('Catégorie introuvable');

    const sub = cat.subCategories?.find((s) => s.id === subCategoryId);
    if (!sub) throw new Error('Sous-catégorie introuvable');

    const set = new Set([...(sub.productIds ?? []), ...productIds]);
    return this.updateSubCategory(categoryId, subCategoryId, {
      productIds: Array.from(set),
    });
  }

  async detachProductsFromSubCategory(
    categoryId: number,
    subCategoryId: number,
    productIds: number[]
  ): Promise<SubCategory> {
    const cat = await this.getById(categoryId);
    if (!cat) throw new Error('Catégorie introuvable');

    const sub = cat.subCategories?.find((s) => s.id === subCategoryId);
    if (!sub) throw new Error('Sous-catégorie introuvable');

    const keep = (sub.productIds ?? []).filter((pid) => !productIds.includes(pid));
    return this.updateSubCategory(categoryId, subCategoryId, { productIds: keep });
  }

  slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
