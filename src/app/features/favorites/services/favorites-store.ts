import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth';

export interface FavoriteItem {
  productId: number;
  addedAt: string; // ISO date
}

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly auth = inject(AuthService);

  // État en mémoire
  private readonly _items = signal<FavoriteItem[]>([]);
  /** Lecture seule pour les composants */
  readonly items = this._items.asReadonly();

  /** Id utilisateur courant (ou null) */
  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);

  /** Clé de stockage (invite ou utilisateur connecté) */
  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return `favorites:${uid ?? 'guest'}`;
  });

  /** Liste d'ids des produits favoris */
  readonly ids = computed<number[]>(() => this._items().map((i) => i.productId));

  /** Compteur */
  readonly count = computed<number>(() => this._items().length);

  /** Pour éviter de re-fusionner à chaque tick */
  private lastMergedUserId: number | null = null;

  constructor() {
    // Charger quand la clé change (login/logout)
    effect(() => {
      const key = this.storageKey();
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
      localStorage.setItem(key, JSON.stringify(this._items()));
    });

    effect(() => {
      const uid = this.userId();
      if (uid && this.lastMergedUserId !== uid) {
        this.mergeGuestIntoUser(uid);
        this.lastMergedUserId = uid;
      }
    });

    // Écouter les changements de localStorage (autres onglets)
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      // Si la clé modifiée correspond à la clé courante, on recharge
      if (e.key === this.storageKey()) {
        try {
          this._items.set(e.newValue ? (JSON.parse(e.newValue) as FavoriteItem[]) : []);
        } catch {
          /* ignore */
        }
      }
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

  /** Fusionne les favoris "guest" vers l'utilisateur connecté puis nettoie la clé guest */
  private mergeGuestIntoUser(uid: number): void {
    const guestKey = 'favorites:guest';
    const userKey = `favorites:${uid}`;

    try {
      const guestRaw = localStorage.getItem(guestKey);
      const userRaw = localStorage.getItem(userKey);

      const guest: FavoriteItem[] = guestRaw ? JSON.parse(guestRaw) : [];
      const user: FavoriteItem[] = userRaw ? JSON.parse(userRaw) : [];

      if (!guest.length) return;

      const map = new Map<number, FavoriteItem>();
      // garder l’ordre d’ajout utilisateur, puis compléter avec les manquants guest
      for (const it of user) map.set(it.productId, it);
      for (const it of guest) if (!map.has(it.productId)) map.set(it.productId, it);

      const merged = Array.from(map.values());
      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);

      // si on est déjà sur cette clé, refléter en mémoire
      if (this.storageKey() === userKey) {
        this._items.set(merged);
      }
    } catch {
      /* ignore */
    }
  }
}
