import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth';

export interface FavoriteItem {
  productId: number;
  addedAt: string; // ISO date
}

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly auth = inject(AuthService);

  // items en mémoire
  private readonly _items = signal<FavoriteItem[]>([]);
  /** Lecture seule pour le composant si besoin */
  readonly items = this._items.asReadonly();

  /** Id utilisateur courant (ou null) */
  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);

  /** Clé de stockage dépendante de l'utilisateur */
  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return uid ? `favorites:${uid}` : null;
  });

  /** Liste d'ids des produits favoris */
  readonly ids = computed<number[]>(() => this._items().map((i) => i.productId));

  /** Compteur */
  readonly count = computed<number>(() => this._items().length);

  constructor() {
    // Charger quand l'utilisateur change
    effect(() => {
      const key = this.storageKey();
      if (!key) {
        this._items.set([]);
        return;
      }
      try {
        const raw = localStorage.getItem(key);
        this._items.set(raw ? (JSON.parse(raw) as FavoriteItem[]) : []);
      } catch {
        this._items.set([]);
      }
    });

    // Persister quand items (ou l'utilisateur) changent
    effect(() => {
      const key = this.storageKey();
      if (!key) return;
      localStorage.setItem(key, JSON.stringify(this._items()));
    });
  }

  /** Vérifie si un produit est favori */
  isFavorite(productId: number): boolean {
    return this._items().some((i) => i.productId === productId);
  }

  add(productId: number): void {
    if (this.isFavorite(productId)) return;
    this._items.update((arr) => [...arr, { productId, addedAt: new Date().toISOString() }]);
  }

  remove(productId: number): void {
    this._items.update((arr) => arr.filter((i) => i.productId !== productId));
  }

  /** Toggle: true = ajouté, false = retiré */
  toggle(productId: number): boolean {
    if (this.isFavorite(productId)) {
      this.remove(productId);
      return false;
    } else {
      this.add(productId);
      return true;
    }
  }

  clear(): void {
    this._items.set([]);
  }
}
