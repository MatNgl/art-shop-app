// src/app/features/catalog/services/format.service.ts
import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { PrintFormat, Unit } from '../../catalog/models/print-format.model';

/**
 * Service unique pour les formats d’impression.
 * - Persistance locale (localStorage) + cache mémoire (signals)
 * - CRUD typé, slugify, unicité slug, helpers count/actifs
 * - Compatible avec les anciens appels (getAll(true), getCount())
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private static readonly STORAGE_KEY = 'artshop.printFormats';

  /** Seed par défaut : A6..A2 */
  private static readonly DEFAULTS: Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'A6',
      slug: 'a6',
      width: 10.5,
      height: 14.8,
      unit: 'cm',
      isActive: true,
      description: 'Format ISO A6',
    },
    {
      name: 'A5',
      slug: 'a5',
      width: 14.8,
      height: 21,
      unit: 'cm',
      isActive: true,
      description: 'Format ISO A5',
    },
    {
      name: 'A4',
      slug: 'a4',
      width: 21,
      height: 29.7,
      unit: 'cm',
      isActive: true,
      description: 'Format ISO A4',
    },
    {
      name: 'A3',
      slug: 'a3',
      width: 29.7,
      height: 42,
      unit: 'cm',
      isActive: true,
      description: 'Format ISO A3',
    },
    {
      name: 'A2',
      slug: 'a2',
      width: 42,
      height: 59.4,
      unit: 'cm',
      isActive: true,
      description: 'Format ISO A2',
    },
  ];

  /** Cache mémoire */
  readonly formats = signal<PrintFormat[]>([]);
  /** Loading flag (utile si tu passes à HTTP plus tard) */
  readonly loading = signal<boolean>(false);

  // Réservé pour une éventuelle migration API

  private readonly http = inject(HttpClient);

  constructor() {
    const initial = this._load();
    this.formats.set(this._sorted(initial));

    // Persistance auto sur toute mutation
    effect(() => {
      const data = this.formats();
      this._persist(data);
    });
  }

  // ===========================================================================
  // Public API (compat conservée)
  // ===========================================================================

  /**
   * Retourne tous les formats.
   * @param activeOnly si true, ne retourne que les formats actifs
   */
  getAll(activeOnly = false): Promise<PrintFormat[]> {
    const list = this.formats();
    return Promise.resolve(activeOnly ? list.filter((f) => f.isActive) : list);
  }

  /** Nombre de formats (option : actifs uniquement) */
  getCount(activeOnly = false): Promise<number> {
    return this.getAll(activeOnly).then((arr) => arr.length);
  }

  getActive(): Promise<PrintFormat[]> {
    return this.getAll(true);
  }

  getById(id: number): Promise<PrintFormat | null> {
    return Promise.resolve(this.formats().find((f) => f.id === id) ?? null);
  }

  getBySlug(slug: string): Promise<PrintFormat | null> {
    const s = this.slugify(slug);
    return Promise.resolve(this.formats().find((f) => f.slug === s) ?? null);
  }

  /** Création (slug généré si vide), unicité slug vérifiée. */
  async create(data: Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrintFormat> {
    const now = new Date().toISOString();
    const nextId = this._nextId(this.formats());
    const payload = this._normalizePayload(data);

    if (!(await this.isSlugUnique(payload.slug))) {
      throw new Error('Slug déjà utilisé.');
    }

    const created: PrintFormat = { ...payload, id: nextId, createdAt: now, updatedAt: now };
    this.formats.set(this._sorted([...this.formats(), created]));
    return created;
  }

  /** Mise à jour partielle (vérifie unicité du slug si modifié). */
  async update(
    id: number,
    patch: Partial<Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PrintFormat> {
    const list = this.formats();
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Format introuvable.');

    const current = list[idx];

    // Slug
    let nextSlug = current.slug;
    if (typeof patch.slug === 'string' && patch.slug.trim()) {
      const normalized = this.slugify(patch.slug);
      if (!(await this.isSlugUnique(normalized, id))) {
        throw new Error('Slug déjà utilisé.');
      }
      nextSlug = normalized;
    }

    const updated: PrintFormat = {
      ...current,
      ...patch,
      slug: nextSlug,
      ...(typeof patch.width === 'number' ? { width: this._sanitizeNumber(patch.width) } : {}),
      ...(typeof patch.height === 'number' ? { height: this._sanitizeNumber(patch.height) } : {}),
      ...(patch.unit ? { unit: this._normalizeUnit(patch.unit) } : {}),
      updatedAt: new Date().toISOString(),
    };

    const next = [...list];
    next[idx] = updated;
    this.formats.set(this._sorted(next));
    return updated;
  }

  async remove(id: number): Promise<void> {
    this.formats.set(this._sorted(this.formats().filter((f) => f.id !== id)));
  }

  // Helpers

  slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async isSlugUnique(slug: string, ignoreId?: number): Promise<boolean> {
    const s = this.slugify(slug);
    return !this.formats().some((f) => f.slug === s && f.id !== ignoreId);
  }

  // ===========================================================================
  // Storage / normalisation
  // ===========================================================================

  private _load(): PrintFormat[] {
    try {
      const raw = localStorage.getItem(FormatService.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PrintFormat[];
        return parsed.map((p) => this._coercePrintFormat(p));
      }
    } catch {
      // ignore
    }

    // Seed
    const now = new Date().toISOString();
    const seeded: PrintFormat[] = FormatService.DEFAULTS.map((d, i) => ({
      ...d,
      id: i + 1,
      createdAt: now,
      updatedAt: now,
    }));
    this._persist(seeded);
    return seeded;
  }

  private _persist(list: PrintFormat[]): void {
    try {
      localStorage.setItem(FormatService.STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private _normalizePayload(
    data: Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>
  ): Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'> {
    const name = data.name?.trim();
    if (!name || name.length < 2) throw new Error('Nom invalide.');

    const width = this._sanitizeNumber(data.width);
    const height = this._sanitizeNumber(data.height);
    if (width <= 0 || height <= 0) throw new Error('Dimensions invalides.');

    const unit = this._normalizeUnit(data.unit);
    const slug = this.slugify(data.slug && data.slug.trim() ? data.slug : name);

    return {
      name,
      slug,
      width,
      height,
      unit,
      isActive: !!data.isActive,
      description: data.description?.trim() || undefined,
    };
  }

  private _coercePrintFormat(p: Partial<PrintFormat>): PrintFormat {
    const name = (p.name ?? '').toString();
    const slug = this.slugify((p.slug ?? name).toString());
    const width = this._sanitizeNumber(p.width ?? 0);
    const height = this._sanitizeNumber(p.height ?? 0);
    const unit = this._normalizeUnit((p.unit as Unit) ?? 'cm');
    const isActive = Boolean(p.isActive);
    const createdAt = p.createdAt ?? new Date().toISOString();
    const updatedAt = p.updatedAt ?? createdAt;

    return {
      id: Number(p.id ?? 0),
      name,
      slug,
      width,
      height,
      unit,
      isActive,
      description: (p.description ?? undefined) || undefined,
      createdAt,
      updatedAt,
    };
  }

  private _normalizeUnit(unit: Unit): Unit {
    if (unit === 'mm') return 'mm';
    if (unit === 'in') return 'in';
    return 'cm';
  }

  private _sanitizeNumber(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Number(n));
  }

  private _nextId(list: PrintFormat[]): number {
    return (list.reduce((m, f) => Math.max(m, f.id), 0) || 0) + 1;
  }

  private _sorted(list: PrintFormat[]): PrintFormat[] {
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
