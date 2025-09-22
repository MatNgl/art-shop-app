import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth';

export interface Address {
    id: string;
    label?: string;       // ex: "Domicile", "Bureau"
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
}

const ADDR_VERSION = 'v1';
const MAX_ADDRESSES = 3;

/* --- Safe localStorage helpers --- */
function safeRead<T>(key: string): T | null {
    try {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
}
function safeWrite<T>(key: string, value: T) {
    try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(value));
    } catch {/* noop */ }
}

@Injectable({ providedIn: 'root' })
export class AddressesStore {
    private auth = inject(AuthService);

    // Etat
    private readonly _items = signal<Address[]>([]);
    readonly items = this._items.asReadonly();

    // Dérivés
    readonly count = computed(() => this._items().length);
    readonly hasDefault = computed(() => this._items().some(a => !!a.isDefault));
    readonly max = MAX_ADDRESSES;

    // User/clé
    private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);
    private readonly storageKey = computed(() => {
        const uid = this.userId();
        return uid ? `addresses:${uid}:${ADDR_VERSION}` : `addresses:guest:${ADDR_VERSION}`;
    });

    constructor() {
        // Charger depuis localStorage quand la clé change
        effect(() => {
            const key = this.storageKey();
            const saved = safeRead<Address[]>(key);
            const arr = Array.isArray(saved) ? saved : [];
            this._items.set(this.normalizeDefault(arr));
        });

        // Persister avec petit debounce
        let persistTimer: ReturnType<typeof setTimeout> | null = null;
        effect(() => {
            const key = this.storageKey();
            const snapshot = this._items();
            if (persistTimer) clearTimeout(persistTimer);
            persistTimer = setTimeout(() => safeWrite(key, snapshot), 120);
        });

        // Synchro multi-onglets
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (!e.key || e.key !== this.storageKey()) return;
                try {
                    const next = e.newValue ? (JSON.parse(e.newValue) as Address[]) : [];
                    this._items.set(this.normalizeDefault(Array.isArray(next) ? next : []));
                } catch { /* ignore */ }
            });
        }
    }

    /* ---------- API ---------- */

    list(): Address[] { return this._items(); }

    add(addr: Omit<Address, 'id'>) {
        const current = this._items();
        if (current.length >= MAX_ADDRESSES) throw new Error('MAX_ADDR');

        const id = crypto.randomUUID?.() ?? String(Date.now());
        const next = [...current, { ...addr, id }];
        this._items.set(this.normalizeDefault(next));
    }

    update(id: string, patch: Partial<Address>) {
        const next = this._items().map(a => a.id === id ? { ...a, ...patch } : a);
        this._items.set(this.normalizeDefault(next));
    }

    remove(id: string) {
        const next = this._items().filter(a => a.id !== id);
        this._items.set(this.normalizeDefault(next));
    }

    setDefault(id: string) {
        const next = this._items().map(a => ({ ...a, isDefault: a.id === id }));
        this._items.set(next);
    }

    clear() { this._items.set([]); }

    /* ---------- Helpers ---------- */

    private normalizeDefault(arr: Address[]) {
        if (!arr.length) return arr;
        // S’il n’y a pas de défaut, mettre le premier
        if (!arr.some(a => !!a.isDefault)) {
            const [first, ...rest] = arr;
            return [{ ...first, isDefault: true }, ...rest.map(a => ({ ...a, isDefault: false }))];
        }
        // S’il y en a plusieurs, ne garder que le premier comme défaut
        let seen = false;
        return arr.map(a => {
            if (a.isDefault && !seen) { seen = true; return { ...a, isDefault: true }; }
            return { ...a, isDefault: false };
        });
    }
}
