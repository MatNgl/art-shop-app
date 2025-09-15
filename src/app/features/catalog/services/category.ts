import { Injectable, signal } from '@angular/core';
import { Category } from '../models/category.model';

export type { Category } from '../models/category.model';
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  /**
   * Catégories seedées pour coller aux categoryId utilisés dans ProductService :
   * 1 = Dessin, 2 = Peinture, 3 = Art numérique, 4 = Photographie
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // --- Queries
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
    if (id === null) return '—';
    return this._categories().find((c) => c.id === id)?.name ?? '—';
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

  // --- Mutations
  async create(payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    await this.delay(150);
    const list = this._categories();
    const nextId = list.length ? Math.max(...list.map((c) => c.id)) + 1 : 1;
    const now = new Date().toISOString();
    const created: Category = { id: nextId, createdAt: now, updatedAt: now, ...payload };
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

  slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
