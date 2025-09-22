import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth';

export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';

export interface PaymentMethod {
  id: string;
  brand: PaymentBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder?: string;
  isDefault?: boolean;
}

const PM_VERSION = 'v1';

/* --- Safe localStorage helpers --- */
function safeRead<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeWrite<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

/* --- ID generator (robuste) --- */
function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  // Fallback raisonnable
  return `pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private auth = inject(AuthService);

  private readonly _items = signal<PaymentMethod[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = computed(() => this._items().length);
  readonly hasDefault = computed(() => this._items().some(p => !!p.isDefault));

  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);
  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return uid ? `payments:${uid}:${PM_VERSION}` : `payments:guest:${PM_VERSION}`;
  });

  constructor() {
    // Charger depuis le storage à chaque changement de clé (login/logout/changement d’utilisateur)
    effect(() => {
      const key = this.storageKey();
      const saved = safeRead<PaymentMethod[]>(key);
      const arr = Array.isArray(saved) ? saved : [];
      this._items.set(this.normalizeDefault(arr));
    });

    // Sauvegarder avec un (léger) debounce
    let persistTimer: number | null = null;
    effect(() => {
      const key = this.storageKey();
      const snapshot = this._items();
      if (persistTimer !== null) clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => safeWrite(key, snapshot), 120);
    });

    // Synchro multi-onglets
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        const currentKey = this.storageKey();
        if (!e.key || e.key !== currentKey) return;
        try {
          const next = e.newValue ? (JSON.parse(e.newValue) as PaymentMethod[]) : [];
          this._items.set(this.normalizeDefault(Array.isArray(next) ? next : []));
        } catch {
          /* ignore */
        }
      });
    }
  }

  /* ---------- API ---------- */

  list(): PaymentMethod[] {
    return this._items();
  }

  add(pm: Omit<PaymentMethod, 'id'> & Partial<Pick<PaymentMethod, 'id'>>) {
    // ⚠️ On ne stocke que des métadonnées (brand/last4/exp) — jamais PAN/CVC
    const id = pm.id ?? genId();
    const next = [...this._items(), { ...pm, id }];
    this._items.set(this.normalizeDefault(next));
  }

  remove(id: string) {
    const next = this._items().filter(p => p.id !== id);
    this._items.set(this.normalizeDefault(next));
  }

  setDefault(id: string) {
    const next = this._items().map(p => ({ ...p, isDefault: p.id === id }));
    this._items.set(next);
  }

  update(id: string, patch: Partial<PaymentMethod>) {
    const next = this._items().map(p => (p.id === id ? { ...p, ...patch } : p));
    this._items.set(this.normalizeDefault(next));
  }

  clear() {
    this._items.set([]);
  }

  /* ---------- Helpers ---------- */

  private normalizeDefault(arr: PaymentMethod[]) {
    if (!arr.length) return arr;

    // S’il n’y a pas de défaut, forcer le premier en défaut
    if (!arr.some(p => !!p.isDefault)) {
      const [first, ...rest] = arr;
      return [{ ...first, isDefault: true }, ...rest.map(p => ({ ...p, isDefault: false }))];
    }

    // S’il y en a plusieurs, garder le premier rencontré
    let seen = false;
    return arr.map(p => {
      if (p.isDefault && !seen) {
        seen = true;
        return { ...p, isDefault: true };
      }
      return { ...p, isDefault: false };
    });
  }
}
