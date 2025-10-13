import { Injectable, signal, effect } from '@angular/core';

export interface BrowsingHistoryItem {
  productId: number;
  title: string;
  imageUrl: string;
  price: number;
  categorySlug?: string;
  timestamp: number;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class BrowsingHistoryService {
  private readonly BROWSING_KEY = 'browsing_history';
  private readonly SEARCH_KEY = 'search_history';
  private readonly MAX_BROWSING_ITEMS = 20;
  private readonly MAX_SEARCH_ITEMS = 10;

  // Signals pour réactivité
  browsingHistory = signal<BrowsingHistoryItem[]>([]);
  searchHistory = signal<SearchHistoryItem[]>([]);

  constructor() {
    this.loadFromStorage();

    // Effet pour persister automatiquement les changements
    effect(() => {
      localStorage.setItem(this.BROWSING_KEY, JSON.stringify(this.browsingHistory()));
    });

    effect(() => {
      localStorage.setItem(this.SEARCH_KEY, JSON.stringify(this.searchHistory()));
    });
  }

  /**
   * Ajoute un produit consulté à l'historique
   */
  addBrowsingItem(item: Omit<BrowsingHistoryItem, 'timestamp'>): void {
    const history = this.browsingHistory();
    const now = Date.now();

    // Retirer l'item s'il existe déjà
    const filtered = history.filter((h) => h.productId !== item.productId);

    // Ajouter en premier (plus récent)
    const updated = [{ ...item, timestamp: now }, ...filtered].slice(0, this.MAX_BROWSING_ITEMS);

    this.browsingHistory.set(updated);
  }

  /**
   * Ajoute une recherche à l'historique
   */
  addSearchQuery(query: string): void {
    if (!query.trim()) return;

    const history = this.searchHistory();
    const now = Date.now();
    const normalizedQuery = query.trim().toLowerCase();

    // Retirer la recherche si elle existe déjà
    const filtered = history.filter((h) => h.query.toLowerCase() !== normalizedQuery);

    // Ajouter en premier
    const updated = [{ query: query.trim(), timestamp: now }, ...filtered].slice(
      0,
      this.MAX_SEARCH_ITEMS
    );

    this.searchHistory.set(updated);
  }

  /**
   * Récupère les N derniers produits consultés
   */
  getRecentItems(limit = 10): BrowsingHistoryItem[] {
    return this.browsingHistory().slice(0, limit);
  }

  /**
   * Récupère les N dernières recherches
   */
  getRecentSearches(limit = 5): SearchHistoryItem[] {
    return this.searchHistory().slice(0, limit);
  }

  /**
   * Supprime un produit de l'historique
   */
  removeBrowsingItem(productId: number): void {
    const filtered = this.browsingHistory().filter((h) => h.productId !== productId);
    this.browsingHistory.set(filtered);
  }

  /**
   * Supprime une recherche de l'historique
   */
  removeSearchQuery(query: string): void {
    const filtered = this.searchHistory().filter((h) => h.query !== query);
    this.searchHistory.set(filtered);
  }

  /**
   * Vide l'historique de navigation
   */
  clearBrowsingHistory(): void {
    this.browsingHistory.set([]);
    localStorage.removeItem(this.BROWSING_KEY);
  }

  /**
   * Vide l'historique de recherche
   */
  clearSearchHistory(): void {
    this.searchHistory.set([]);
    localStorage.removeItem(this.SEARCH_KEY);
  }

  /**
   * Charge les historiques depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const browsingData = localStorage.getItem(this.BROWSING_KEY);
      if (browsingData) {
        const parsed = JSON.parse(browsingData) as BrowsingHistoryItem[];
        this.browsingHistory.set(parsed);
      }

      const searchData = localStorage.getItem(this.SEARCH_KEY);
      if (searchData) {
        const parsed = JSON.parse(searchData) as SearchHistoryItem[];
        this.searchHistory.set(parsed);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  }
}
