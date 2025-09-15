import { Injectable, signal, inject, Injector } from '@angular/core';
import { Artist, Product } from '../models/product.model';
// ❌ SUPPRIMÉ: import { ProductService } from './product'; // causait le cycle

const MALE_AVATAR_URL =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face';
const FEMALE_AVATAR_URL =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  // Optionnel: si tu veux une méthode "convenience" qui va chercher les produits,
  // on utilisera l'injector à la demande (pas d'injection au niveau du champ)
  private readonly injector = inject(Injector);

  private readonly _artists = signal<Artist[]>([
    {
      id: 1,
      name: 'Matthéo Naegellen',
      bio: 'Artiste contemporain.',
      profileImage: MALE_AVATAR_URL,
    },
    {
      id: 2,
      name: 'Jean-Pierre Moreau',
      bio: 'Portraitiste expressionniste.',
      profileImage: MALE_AVATAR_URL,
    },
    {
      id: 3,
      name: 'Virginie Coste',
      bio: 'Artiste digitale abstraite.',
      profileImage: FEMALE_AVATAR_URL,
    },
    {
      id: 4,
      name: 'Antoine Roux',
      bio: 'Peinture traditionnelle.',
      // NOTE: avatar féminin ici dans ton code d’origine, garde si c’était voulu
      profileImage: FEMALE_AVATAR_URL,
    },
    {
      id: 5,
      name: 'Claire Beaumont',
      bio: 'Photographe de montagne.',
      profileImage: FEMALE_AVATAR_URL,
    },
    {
      id: 1002,
      name: 'Capucine Henry',
      bio: 'Photographe & créatrice.',
      profileImage: FEMALE_AVATAR_URL,
    },
  ]);

  private delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  async getAll(): Promise<Artist[]> {
    await this.delay(120);
    return [...this._artists()];
  }

  async getCount(): Promise<number> {
    await this.delay(60);
    return this._artists().length;
  }

  async getById(id: number): Promise<Artist | null> {
    await this.delay(100);
    return this._artists().find((a: Artist) => a.id === id) ?? null;
  }

  async search(term: string): Promise<Artist[]> {
    await this.delay(80);
    const q = term.trim().toLowerCase();
    if (!q) return this.getAll();
    return this._artists().filter((a: Artist) => a.name.toLowerCase().includes(q));
  }

  async create(data: Omit<Artist, 'id'>): Promise<Artist> {
    await this.delay(150);
    const list = this._artists();
    const newId = list.length ? Math.max(...list.map((a: Artist) => a.id)) + 1 : 1;
    const created: Artist = { id: newId, ...data };
    this._artists.set([created, ...list]);
    return created;
  }

  async update(id: number, patch: Partial<Artist>): Promise<Artist> {
    await this.delay(150);
    const list = this._artists();
    const i = list.findIndex((a: Artist) => a.id === id);
    if (i < 0) throw new Error('Artiste introuvable');
    const updated: Artist = { ...list[i], ...patch, id };
    const next = [...list];
    next[i] = updated;
    this._artists.set(next);
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.delay(120);
    const list = this._artists();
    this._artists.set(list.filter((a: Artist) => a.id !== id));
  }

  async countLinkedProducts(artistId: number, products: Product[]): Promise<number> {
    await this.delay(1); // optionnel, pour rester async
    return products.filter((p) => (p.artist?.id ?? p.artistId) === artistId).length;
  }

  async countLinkedProductsUsingProductService(artistId: number): Promise<number> {
    const { ProductService } = await import('./product'); // import dynamique pour éviter le cycle
    const productSvc = this.injector.get(ProductService);
    const all = await productSvc.getAllProducts();
    return all.filter((p) => (p.artist?.id ?? p.artistId) === artistId).length;
  }
}
