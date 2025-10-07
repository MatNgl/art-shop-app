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
    { id: 'avatar-grad-1', name: 'Pastel 1', className: 'avatar-grad-1', primary: '#8B5CF6' },
    { id: 'avatar-grad-2', name: 'Pastel 2', className: 'avatar-grad-2', primary: '#EC4899' },
    { id: 'avatar-grad-3', name: 'Pastel 3', className: 'avatar-grad-3', primary: '#3B82F6' },
    { id: 'avatar-grad-4', name: 'Pastel 4', className: 'avatar-grad-4', primary: '#10B981' },
    { id: 'avatar-grad-5', name: 'Pastel 5', className: 'avatar-grad-5', primary: '#F59E0B' },
    { id: 'avatar-grad-6', name: 'Pastel 6', className: 'avatar-grad-6', primary: '#F43F5E' },
    { id: 'avatar-grad-7', name: 'Pastel 7', className: 'avatar-grad-7', primary: '#06B6D4' },
    { id: 'avatar-grad-8', name: 'Pastel 8', className: 'avatar-grad-8', primary: '#A3E635' },
    { id: 'avatar-grad-9', name: 'Pastel 9', className: 'avatar-grad-9', primary: '#EA580C' },
    { id: 'avatar-grad-10', name: 'Pastel 10', className: 'avatar-grad-10', primary: '#6366F1' },
  ] as const;

  // Thèmes disponibles = défaut + customs (persistés)
  private readonly _customThemes = signal<BadgeTheme[]>(this.loadCustomThemes());
  private readonly _themes = computed<BadgeTheme[]>(() => [
    ...this.DEFAULT_THEMES,
    ...this._customThemes(),
  ]);

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

  constructor() {
    // Synchronise automatiquement le thème quand l'utilisateur change
    effect(() => {
      const uid = this.auth.currentUser$()?.id ?? null;
      this.initForUser(uid);
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

  /** Ajout d’un thème custom (persisté). Id doit être unique. */
  addCustomTheme(theme: BadgeTheme): void {
    if (!theme.id || !theme.className) return;
    if (this.exists(theme.id)) return;
    const next = [...this._customThemes(), theme];
    this._customThemes.set(next);
    this.saveCustomThemes(next);
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
}
