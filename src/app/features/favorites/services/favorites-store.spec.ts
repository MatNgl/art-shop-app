import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FavoritesStore, FavoriteItem } from './favorites-store';
import { AuthService } from '../../auth/services/auth';

type TAuth = Pick<AuthService, 'currentUser$'>;
type TestAuthUser = { id: number; email?: string } | null;

describe('Page Favoris Store (FavoritesStore)', () => {
  // --- Mocks
  let mem: Map<string, string>;
  let getItemSpy: jasmine.Spy<(key: string) => string | null>;

  // signal utilisateur courant (null = invité)
  const currentUserSig = signal<TestAuthUser>(null);
  const authMock: TAuth = { currentUser$: currentUserSig } as unknown as TAuth;

  beforeEach(() => {
    // mémoire locale pour simuler localStorage
    mem = new Map<string, string>();
    getItemSpy = spyOn(localStorage, 'getItem').and.callFake((k: string) =>
      mem.has(k) ? mem.get(k)! : null
    );
    spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => void mem.set(k, v));
    spyOn(localStorage, 'removeItem').and.callFake((k: string) => void mem.delete(k));

    // reset utilisateur
    currentUserSig.set(null);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authMock }, FavoritesStore],
    });
  });

  function put(key: string, value: unknown) {
    mem.set(key, JSON.stringify(value));
  }

  // Laisse le temps aux effect() (macrotâche)
  async function nextMacro() {
    await new Promise((r) => setTimeout(r, 0));
  }

  it('charge les favoris invité au démarrage', async () => {
    const guest: FavoriteItem[] = [
      { productId: 1, addedAt: new Date('2025-01-01T10:00:00Z').toISOString() },
      { productId: 2, addedAt: new Date('2025-01-02T10:00:00Z').toISOString() },
    ];
    put('favorites:guest', guest);

    const store = TestBed.inject(FavoritesStore);

    await nextMacro(); // effect(load)
    await nextMacro(); // effect(persist) éventuel

    expect(store.items().length).toBe(2);
    expect(store.ids()).toEqual([1, 2]);
    expect(store.count()).toBe(2);

    const raw = mem.get('favorites:guest') ?? '[]';
    const persisted = JSON.parse(raw) as FavoriteItem[];
    expect(persisted.map((i) => i.productId)).toEqual([1, 2]);

    expect(getItemSpy).toHaveBeenCalledWith('favorites:guest');
  });

  it('persiste automatiquement quand on ajoute/retire/efface (profil invité)', async () => {
    const store = TestBed.inject(FavoritesStore);

    // Laisser le temps au chargement initial pour éviter qu'il n'écrase nos ajouts
    await nextMacro();
    await nextMacro();

    store.add(10);
    await nextMacro();
    expect(store.ids()).toEqual([10]);
    {
      const raw = mem.get('favorites:guest') ?? '[]';
      const arr = JSON.parse(raw) as FavoriteItem[];
      expect(arr).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ productId: 10 })]));
    }

    store.toggle(11); // ajoute 11
    await nextMacro();
    expect(store.ids()).toEqual([10, 11]);
    {
      const raw = mem.get('favorites:guest') ?? '[]';
      const ids = (JSON.parse(raw) as FavoriteItem[]).map((i) => i.productId);
      expect(ids).toEqual([10, 11]);
    }

    store.toggle(10); // retire 10
    await nextMacro();
    expect(store.ids()).toEqual([11]);
    {
      const raw = mem.get('favorites:guest') ?? '[]';
      const ids = (JSON.parse(raw) as FavoriteItem[]).map((i) => i.productId);
      expect(ids).toEqual([11]);
    }

    store.clear();
    await nextMacro();
    expect(store.ids()).toEqual([]);
    expect(mem.get('favorites:guest')).toBe('[]');
  });

  it('fusionne les favoris guest vers le compte utilisateur au login, puis nettoie la clé guest', async () => {
    const guest: FavoriteItem[] = [
      { productId: 2, addedAt: '2025-01-02T00:00:00.000Z' },
      { productId: 3, addedAt: '2025-01-03T00:00:00.000Z' },
    ];
    const user42: FavoriteItem[] = [{ productId: 1, addedAt: '2025-01-01T00:00:00.000Z' }];
    put('favorites:guest', guest);
    put('favorites:42', user42);

    const store = TestBed.inject(FavoritesStore);

    currentUserSig.set({ id: 42, email: 'a@b.c' });
    await nextMacro(); // load favorites:42
    await nextMacro(); // merge guest -> user + persist

    const merged = JSON.parse(mem.get('favorites:42') ?? '[]') as FavoriteItem[];
    expect(merged.map((i) => i.productId)).toEqual([1, 2, 3]);

    expect(mem.has('favorites:guest')).toBeFalse();
    expect(store.ids()).toEqual([1, 2, 3]);
    expect(store.count()).toBe(3);
  });

  it('ne fusionne qu’une seule fois par utilisateur (idempotent via lastMergedUserId)', async () => {
    put('favorites:guest', [{ productId: 7, addedAt: '2025-01-07T00:00:00.000Z' }]);
    put('favorites:42', [{ productId: 1, addedAt: '2025-01-01T00:00:00.000Z' }]);

    const store = TestBed.inject(FavoritesStore);

    currentUserSig.set({ id: 42 });
    await nextMacro();
    await nextMacro();

    let after = JSON.parse(mem.get('favorites:42') ?? '[]') as FavoriteItem[];
    expect(after.map((i) => i.productId)).toEqual([1, 7]);

    // On change la guest après la première fusion
    put('favorites:guest', [{ productId: 99, addedAt: '2025-02-01T00:00:00.000Z' }]);

    // Re-set sur le même id pas de re-fusion
    currentUserSig.set({ id: 42 });
    await nextMacro();
    await nextMacro();

    after = JSON.parse(mem.get('favorites:42') ?? '[]') as FavoriteItem[];
    expect(after.map((i) => i.productId)).toEqual([1, 7]); // inchangé
    expect(store.ids()).toEqual([1, 7]);
  });

  it('réagit aux événements storage de la clé courante', () => {
    // invité par défaut
    const store = TestBed.inject(FavoritesStore);

    const updated: FavoriteItem[] = [{ productId: 123, addedAt: '2025-03-01T00:00:00.000Z' }];
    const payload = JSON.stringify(updated);

    mem.set('favorites:guest', payload);

    window.dispatchEvent(new StorageEvent('storage', { key: 'favorites:guest', newValue: payload }));

    expect(store.ids()).toEqual([123]);
    expect(store.count()).toBe(1);
  });

  it('isFavorite renvoie vrai/faux correctement', async () => {
    const store = TestBed.inject(FavoritesStore);

    await nextMacro();
    await nextMacro();

    store.add(5);
    store.add(6);
    await nextMacro();

    expect(store.isFavorite(5)).toBeTrue();
    expect(store.isFavorite(6)).toBeTrue();
    expect(store.isFavorite(7)).toBeFalse();

    store.remove(5);
    await nextMacro();
    expect(store.isFavorite(5)).toBeFalse();
  });
});
