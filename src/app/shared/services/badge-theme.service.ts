// FILE: src/app/shared/services/badge-theme.service.ts
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BadgeTheme } from '../models/badge-theme.model';
import { AuthService } from '../../features/auth/services/auth';

/**
 * Service de thème d’avatar partagé.
 * - 10 thèmes par défaut (dégradés radiaux pastels)
 * - Choix aléatoire par utilisateur à chaque (re)connexion
 * - Persistance locale par userId/guest
 * - Extensible (custom themes) pour une future UI d’admin
 */
@Injectable({ providedIn: 'root' })
export class BadgeThemeService {
  private readonly auth = inject(AuthService);

  // Thèmes par défaut (id === className pour simplicité)
  private readonly DEFAULT_THEMES: readonly BadgeTheme[] = [
    { id: 'avatar-grad-1', name: 'Pastel 3', className: 'avatar-grad-1', primary: '#3B82F6', gradient: 'radial-gradient(120% 120% at 10% 0%, #ffd1dc 0%, #f9e2af 35%, #d1f8ff 70%, #e6e0ff 100%)' },
    { id: 'avatar-grad-2', name: 'Pastel 4', className: 'avatar-grad-2', primary: '#10B981', gradient: 'radial-gradient(120% 120% at 90% 10%, #fcd1ff 0%, #ffe5b4 35%, #d7f9f7 70%, #e7e0ff 100%)' },
    { id: 'avatar-grad-3', name: 'Pastel 3', className: 'avatar-grad-3', primary: '#3B82F6', gradient: 'radial-gradient(120% 120% at 10% 90%, #ffe0b5 0%, #ffd6e7 35%, #d6f0ff 70%, #e7e7ff 100%)' },
    { id: 'avatar-grad-4', name: 'Pastel 4', className: 'avatar-grad-4', primary: '#10B981', gradient: 'radial-gradient(120% 120% at 80% 80%, #ffd3ba 0%, #ffe3f1 35%, #daf3ff 70%, #e0e0ff 100%)' },
    { id: 'avatar-grad-5', name: 'Pastel 5', className: 'avatar-grad-5', primary: '#F59E0B', gradient: 'radial-gradient(120% 120% at 20% 50%, #ffd6d6 0%, #fff0c2 40%, #d9f7ff 75%, #e7e0ff 100%)' },
    { id: 'avatar-grad-6', name: 'Pastel 6', className: 'avatar-grad-6', primary: '#F43F5E', gradient: 'radial-gradient(120% 120% at 70% 30%, #ffe0ef 0%, #ffe9bf 35%, #d7fff3 70%, #e3e0ff 100%)' },
    { id: 'avatar-grad-7', name: 'Pastel 7', className: 'avatar-grad-7', primary: '#06B6D4', gradient: 'radial-gradient(120% 120% at 30% 70%, #ffd9c7 0%, #ffefdf 35%, #d7ecff 70%, #f0e6ff 100%)' },
    { id: 'avatar-grad-8', name: 'Pastel 8', className: 'avatar-grad-8', primary: '#A3E635', gradient: 'radial-gradient(120% 120% at 50% 50%, #ffd7e6 0%, #ffe9c7 35%, #d7f3ff 70%, #ebe4ff 100%)' },
    { id: 'avatar-grad-9', name: 'Pastel 9', className: 'avatar-grad-9', primary: '#EA580C', gradient: 'radial-gradient(120% 120% at 40% 20%, #ffe6cc 0%, #ffd6ea 35%, #d6f5ff 70%, #e8e4ff 100%)' },
    { id: 'avatar-grad-10', name: 'Pastel 10', className: 'avatar-grad-10', primary: '#6366F1', gradient: 'radial-gradient(120% 120% at 60% 80%, #ffd9d0 0%, #fff0cf 35%, #d2f7ff 70%, #e7e0ff 100%)' },
  ] as const;

  // Thèmes supprimés (IDs)
  private readonly _hiddenThemeIds = signal<string[]>(this.loadHiddenThemeIds());

  // Thèmes disponibles = défaut + customs (persistés), filtrés par hiddenIds
  private readonly _customThemes = signal<BadgeTheme[]>(this.loadCustomThemes());
  private readonly _themes = computed<BadgeTheme[]>(() => {
    const hidden = this._hiddenThemeIds();
    return [
      ...this.DEFAULT_THEMES.filter((t) => !hidden.includes(t.id)),
      ...this._customThemes().filter((t) => !hidden.includes(t.id)),
    ];
  });

  // Thème courant (id) + projection
  private readonly _currentId = signal<string>(this.DEFAULT_THEMES[0].id);
  private readonly _currentTheme = computed<BadgeTheme>(() => {
    const all = this._themes();
    const found = all.find((t) => t.id === this._currentId());
    return found ?? all[0];
  });

  /** Classe CSS à appliquer sur l’avatar */
  private readonly _avatarClass = computed<string>(() => this._currentTheme().className);
  /** Couleur primaire associée au thème */
  private readonly _primary = computed<string>(() => this._currentTheme().primary);

  // Track la dernière session pour détecter nouvelle connexion
  private _lastSessionUserId = signal<number | null>(null);

  constructor() {
    // Synchronise automatiquement le thème quand l'utilisateur change
    effect(() => {
      const user = this.auth.currentUser$();
      const uid = user?.id ?? null;

      // Détecter une nouvelle connexion (changement d'utilisateur ou login après logout)
      const lastUid = this._lastSessionUserId();
      const isNewLogin = uid !== null && uid !== lastUid;

      if (isNewLogin) {
        // Nouvelle connexion détectée -> rotation automatique
        this.rotateToRandomTheme();
      } else {
        // Sinon, juste init normale
        this.initForUser(uid);
      }

      // Mise à jour de la session
      this._lastSessionUserId.set(uid);
    });
  }

  /** Classe pour [ngClass] (utilisée dans header/sidebar/layout) */
  avatarClass(): string {
    return this._avatarClass();
  }

  /** Couleur primaire si besoin (icônes homogènes, etc.) */
  primary(): string {
    return this._primary();
  }

  /** Thèmes disponibles (pour une future page Admin) */
  listThemes(): BadgeTheme[] {
    return this._themes();
  }

  /** Initialisation/sync par utilisateur (appelé automatiquement via effect) */
  initForUser(userId: number | null): void {
    const saved = this.loadUserThemeId(userId);
    if (saved && this.exists(saved)) {
      this._currentId.set(saved);
      return;
    }
    // Nouveau user/guest -> pick random + persist
    const all = this._themes();
    const idx = Math.floor(Math.random() * all.length);
    const chosen = all[idx]?.id ?? all[0].id;
    this._currentId.set(chosen);
    this.saveUserThemeId(userId, chosen);
  }

  /** Permettre à l’admin de forcer un thème pour l’utilisateur courant */
  setThemeById(id: string): void {
    if (!this.exists(id)) return;
    this._currentId.set(id);
    const uid = this.auth.currentUser$()?.id ?? null;
    this.saveUserThemeId(uid, id);
  }

  /** Ajout d'un thème custom (persisté). Id doit être unique. */
  addCustomTheme(theme: BadgeTheme): void {
    if (!theme.id || !theme.className) return;
    if (this.exists(theme.id)) return;
    const next = [...this._customThemes(), theme];
    this._customThemes.set(next);
    this.saveCustomThemes(next);
  }

  /** Met à jour un thème custom existant */
  updateCustomTheme(id: string, updates: Partial<BadgeTheme>): boolean {
    const customs = this._customThemes();
    const index = customs.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const updated = [...customs];
    updated[index] = { ...updated[index], ...updates };
    this._customThemes.set(updated);
    this.saveCustomThemes(updated);
    return true;
  }

  /** Supprime un thème (custom ou défaut - admin peut tout supprimer) */
  deleteCustomTheme(id: string): boolean {
    const customs = this._customThemes();
    const filtered = customs.filter((t) => t.id !== id);

    // Si c'était un custom theme, le supprimer physiquement
    if (filtered.length !== customs.length) {
      this._customThemes.set(filtered);
      this.saveCustomThemes(filtered);
    }

    // Ajouter à la liste des thèmes cachés (pour tous les thèmes, défaut ou custom)
    const hidden = this._hiddenThemeIds();
    if (!hidden.includes(id)) {
      this._hiddenThemeIds.set([...hidden, id]);
      this.saveHiddenThemeIds([...hidden, id]);
    }

    return true;
  }

  /** Change le thème actuel aléatoirement (pour rotation à la connexion) */
  rotateToRandomTheme(): void {
    const all = this._themes();
    const current = this._currentId();

    // Éviter de tirer le même thème
    const available = all.filter((t) => t.id !== current);
    if (available.length === 0) return;

    const idx = Math.floor(Math.random() * available.length);
    const chosen = available[idx];
    this.setThemeById(chosen.id);
  }

  /** Obtient le thème actuel complet */
  getCurrentTheme(): BadgeTheme {
    return this._currentTheme();
  }

  /** Vérifie si un ID de thème existe */
  themeExists(id: string): boolean {
    return this.exists(id);
  }

  /** Liste seulement les thèmes custom */
  listCustomThemes(): BadgeTheme[] {
    return this._customThemes();
  }

  /** Liste seulement les thèmes par défaut */
  listDefaultThemes(): readonly BadgeTheme[] {
    return this.DEFAULT_THEMES;
  }

  // --- Helpers persistance ---
  private storageKey(userId: number | null): string {
    return `badgeTheme:${userId ?? 'guest'}`;
  }
  private customThemesKey = 'badgeTheme:customThemes';

  private loadUserThemeId(userId: number | null): string | null {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      return raw ?? null;
    } catch {
      return null;
    }
  }
  private saveUserThemeId(userId: number | null, id: string): void {
    try {
      localStorage.setItem(this.storageKey(userId), id);
    } catch {
      /* noop */
    }
  }
  private loadCustomThemes(): BadgeTheme[] {
    try {
      const raw = localStorage.getItem(this.customThemesKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as BadgeTheme[]) : [];
    } catch {
      return [];
    }
  }
  private saveCustomThemes(themes: BadgeTheme[]): void {
    try {
      localStorage.setItem(this.customThemesKey, JSON.stringify(themes));
    } catch {
      /* noop */
    }
  }
  private exists(id: string): boolean {
    return this._themes().some((t) => t.id === id);
  }

  private loadHiddenThemeIds(): string[] {
    try {
      const raw = localStorage.getItem('badgeTheme:hiddenIds');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  private saveHiddenThemeIds(ids: string[]): void {
    try {
      localStorage.setItem('badgeTheme:hiddenIds', JSON.stringify(ids));
    } catch {
      /* noop */
    }
  }
}
