// src/app/features/auth/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { User, LoginRequest, RegisterRequest, UserRole, Address } from '../models/user.model';
import {
  UserActivity,
  ActivityType,
  Order,
  OrderStatus,
  UserFavorite,
  UserExtended,
} from '../models/user-activity.model';

// Patch type pour mise à jour profil (aucun champ requis)
type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>> & {
  address?: Partial<Address>;
};

type SuspensionDate = Date | string | undefined;

interface SuspensionFields {
  isActive?: boolean;
  suspendedAt?: SuspensionDate;
  suspensionReason?: string;
}
/** Vérifie si l'objet porte des champs de suspension (type guard, no any) */
function hasSuspensionFields(u: unknown): u is SuspensionFields {
  if (typeof u !== 'object' || u === null) return false;
  const r = u as Record<string, unknown>;
  return 'isActive' in r || 'suspendedAt' in r || 'suspensionReason' in r;
}

export interface BasicResponse {
  success: boolean;
  message?: string;
  error?: string;
}
// (optionnel en dev) pour récupérer le token dans la réponse et le tester sans email réel
type ResetRequestResponse = BasicResponse & { devToken?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  // --- Données mock en mémoire ---
  private users = signal<User[]>([
    {
      id: 1,
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Matthéo',
      lastName: 'Naegellen',
      role: UserRole.ADMIN,
      phone: '06 11 22 33 44',
      addresses: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    },
    {
      id: 2,
      email: 'user@example.com',
      password: 'user123',
      firstName: 'User',
      lastName: 'Name',
      role: UserRole.USER,
      phone: '06 55 44 33 22',
      addresses: [],
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-06-02T00:00:00Z'),
    },
  ]);

  private currentUser = signal<User | null>(null);

  // Stocks mock supplémentaires
  private activities = signal<UserActivity[]>([]);
  private orders = signal<Order[]>([]);
  private favorites = signal<UserFavorite[]>([]);

  /** Lecture seule pour les composants (signal) */
  public readonly currentUser$ = this.currentUser.asReadonly();

  constructor() {
    // Restaurer la session au démarrage (re-hydrater les dates)
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        this.currentUser.set(parsed);
      } catch {
        /* ignore parse errors */
      }
    }
  }

  // --- Utils ---
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private persistSession(user: User | null) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  // Helper rôle pour logs lisibles
  private getRoleLabel(role: UserRole): string {
    return role === UserRole.ADMIN ? 'Administrateur' : 'Utilisateur';
  }

  // --- Token pour l'intercepteur ---
  getToken(): string | null {
    const user = this.currentUser();
    return user ? `mock-token-${user.id}` : null;
  }

  // --- Auth ---
  async login(
    credentials: LoginRequest
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.delay(400);

    const user = this.users().find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      // journaliser l'échec si l'email existe
      const attempted = this.users().find((u) => u.email === credentials.email);
      if (attempted) {
        await this.logActivity(
          attempted.id,
          ActivityType.FAILED_LOGIN,
          'Tentative de connexion échouée',
          'Identifiants invalides',
          { success: false, failureReason: 'invalid_credentials' }
        );
      }
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    if (this.isSuspended(user)) {
      await this.logActivity(
        user.id,
        ActivityType.FAILED_LOGIN,
        'Tentative de connexion refusée',
        'Compte suspendu',
        { success: false, failureReason: 'account_suspended' }
      );

      // extraire la raison si présente, proprement typée
      const reasonText =
        hasSuspensionFields(user) && user.suspensionReason
          ? `\n\nRaison : ${user.suspensionReason}`
          : '';

      return {
        success: false,
        error:
          `Votre compte est suspendu. Vous ne pouvez pas vous connecter pour le moment.${reasonText}\n\n` +
          `Contactez un administrateur pour plus d’informations.`,
      };
    }

    this.currentUser.set(user);
    this.persistSession(user);

    await this.logActivity(
      user.id,
      ActivityType.LOGIN,
      'Connexion réussie',
      "L'utilisateur s'est connecté avec succès",
      { success: true }
    );

    return { success: true, user };
  }

  async register(
    userData: RegisterRequest
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.delay(600);

    if (this.users().some((u) => u.email === userData.email)) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }
    if (userData.password !== userData.confirmPassword) {
      return { success: false, error: 'Les mots de passe ne correspondent pas' };
    }

    const now = new Date();
    const newUser: User = {
      id: Date.now(),
      email: userData.email,
      password: userData.password, // mock uniquement
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
    };

    this.users.update((arr) => [...arr, newUser]);
    this.currentUser.set(newUser);
    this.persistSession(newUser);

    // Log activité (inscription)
    await this.logActivity(
      newUser.id,
      ActivityType.ACCOUNT_CREATED,
      'Compte créé',
      'Nouvelle inscription (mock)'
    );

    return { success: true, user: newUser };
  }

  async logout(): Promise<void> {
    await this.delay(200);
    const u = this.currentUser();
    this.currentUser.set(null);
    this.persistSession(null);

    if (u) {
      await this.logActivity(
        u.id,
        ActivityType.LOGOUT,
        'Déconnexion',
        'L’utilisateur s’est déconnecté'
      );
    }
  }

  // --- Helpers / Admin ---
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === UserRole.ADMIN;
  }

  /**
   * Récupère tous les utilisateurs (admin uniquement)
   */
  async getAllUsers(): Promise<User[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(300);

    try {
      // En attendant l'API, retourner les données mock enrichies
      return this.getMockUsers();
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      // Données de fallback pour le développement
      return this.getMockUsers();
    }
  }

  public isSuspended(u: Partial<User> | Partial<UserExtended> | null | undefined): boolean {
    if (!u) return false;
    if (!hasSuspensionFields(u)) return false;

    const hasSuspendedAt =
      typeof u.suspendedAt !== 'undefined' && String(u.suspendedAt).trim().length > 0;

    return u.isActive === false || hasSuspendedAt;
  }
  /**
   * Met à jour le rôle d'un utilisateur (admin uniquement)
   */
  async updateUserRole(userId: number, newRole: UserRole): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    // Empêcher l'auto-modification
    if (currentUser.id === userId) {
      throw new Error('Vous ne pouvez pas modifier votre propre rôle');
    }

    await this.delay(400);

    try {
      const mockUsers = this.users();
      const userIndex = mockUsers.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('Utilisateur introuvable');
      }

      const updatedUser = { ...mockUsers[userIndex], role: newRole, updatedAt: new Date() };

      // Mettre à jour le signal
      this.users.update((arr) => {
        const copy = [...arr];
        copy[userIndex] = updatedUser;
        return copy;
      });

      // Log activité — utilise la helper pour un libellé propre
      await this.logActivity(
        userId,
        ActivityType.ROLE_UPDATED,
        'Rôle mis à jour',
        `Rôle changé en ${this.getRoleLabel(newRole)} par ${currentUser.firstName} ${
          currentUser.lastName
        }`,
        { adminId: currentUser.id, newRole }
      );

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur (admin uniquement)
   */
  async deleteUser(userId: number): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    // Empêcher l'auto-suppression
    if (currentUser.id === userId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }

    // Vérifier qu'il reste au moins un admin
    const users = this.users();
    const admins = users.filter((u) => u.role === UserRole.ADMIN);
    const targetUser = users.find((u) => u.id === userId);

    if (targetUser?.role === UserRole.ADMIN && admins.length <= 1) {
      throw new Error('Impossible de supprimer le dernier administrateur');
    }

    await this.delay(300);

    try {
      this.users.update((arr) => arr.filter((u) => u.id !== userId));

      await this.logActivity(
        userId,
        ActivityType.ACCOUNT_DELETED,
        'Compte supprimé',
        `Compte supprimé par ${currentUser.firstName} ${currentUser.lastName}`,
        { adminId: currentUser.id }
      );
    } catch (error) {
      console.error('Erreur lors de la suppression utilisateur:', error);
      throw error;
    }
  }

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('Not authenticated');

    await this.delay(400);

    if (user.password !== payload.currentPassword) {
      throw new Error('Mot de passe actuel incorrect');
    }

    const v = payload.newPassword ?? '';
    const okLen = v.length >= 8;
    const hasLower = /[a-z]/.test(v);
    const hasUpper = /[A-Z]/.test(v);
    const hasDigit = /\d/.test(v);
    if (!(okLen && hasLower && hasUpper && hasDigit)) {
      throw new Error('Le nouveau mot de passe ne respecte pas les critères');
    }

    const updated: User = { ...user, password: v, updatedAt: new Date() };
    this.currentUser.set(updated);
    this.persistSession(updated);

    this.users.update((arr) => {
      const idx = arr.findIndex((u) => u.id === user.id);
      if (idx === -1) return arr;
      const copy = [...arr];
      copy[idx] = { ...copy[idx], password: v, updatedAt: updated.updatedAt };
      return copy;
    });

    await this.logActivity(
      user.id,
      ActivityType.PASSWORD_CHANGE,
      'Mot de passe changé',
      'Changement de mot de passe (mock)'
    );
  }

  /**
   * Récupère les détails complets d'un utilisateur (admin uniquement)
   */
  async getUserDetails(userId: number): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(200);

    try {
      const mockUsers = this.getMockUsers();
      const user = mockUsers.find((u) => u.id === userId);
      if (!user) {
        throw new Error('Utilisateur introuvable');
      }
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      throw error;
    }
  }

  /**
   * Met à jour les informations d'un utilisateur (admin uniquement)
   */
  async updateUserInfo(userId: number, updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(400);

    try {
      const users = this.users();
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('Utilisateur introuvable');
      }

      const updatedUser = {
        ...users[userIndex],
        ...updates,
        id: userId, // S'assurer que l'ID ne change pas
        updatedAt: new Date(),
      };

      this.users.update((arr) => {
        const copy = [...arr];
        copy[userIndex] = updatedUser;
        return copy;
      });

      await this.logActivity(
        userId,
        ActivityType.PROFILE_UPDATE,
        'Profil mis à jour',
        'Mise à jour par un administrateur',
        { adminId: currentUser.id, fields: Object.keys(updates ?? {}) }
      );

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des utilisateurs (admin uniquement)
   */
  async getUserStats(): Promise<{
    total: number;
    admins: number;
    users: number;
    recentRegistrations: number;
    registrationsThisMonth: number;
  }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(200);

    try {
      const users = this.getMockUsers();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: users.length,
        admins: users.filter((u) => u.role === UserRole.ADMIN).length,
        users: users.filter((u) => u.role === UserRole.USER).length,
        recentRegistrations: users.filter((u) => new Date(u.createdAt) >= weekAgo).length,
        registrationsThisMonth: users.filter((u) => new Date(u.createdAt) >= monthStart).length,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      throw error;
    }
  }

  // --- Profil ---
  async updateProfile(patch: ProfilePatch): Promise<void> {
    await this.delay(200);

    const u = this.currentUser();
    if (!u) throw new Error('Not authenticated');

    const { address, ...rest } = patch;

    let mergedAddress: Address | undefined =
      u.addresses?.find((a) => a.isDefault) ?? u.addresses?.[0];
    if (address) {
      mergedAddress = {
        street: address.street ?? mergedAddress?.street ?? '',
        city: address.city ?? mergedAddress?.city ?? '',
        postalCode: address.postalCode ?? mergedAddress?.postalCode ?? '',
        country: address.country ?? mergedAddress?.country ?? '',
      };
    }

    const updated: User = {
      ...u,
      ...rest,
      addresses: mergedAddress ? [{ ...mergedAddress, isDefault: true }] : [],
      updatedAt: new Date(),
    };

    this.currentUser.set(updated);
    this.persistSession(updated);

    this.users.update((arr) => {
      const idx = arr.findIndex((x) => x.id === u.id);
      if (idx === -1) return arr;
      const copy = [...arr];
      copy[idx] = { ...copy[idx], ...updated };
      return copy;
    });

    await this.logActivity(
      u.id,
      ActivityType.PROFILE_UPDATE,
      'Profil mis à jour',
      'Mise à jour du profil utilisateur'
    );
  }

  // --- Mot de passe : demande de reset ---
  async requestPasswordReset(payload: { email: string }): Promise<ResetRequestResponse> {
    await this.delay(400);

    const user = this.users().find((u) => u.email === payload.email);
    if (!user) {
      return {
        success: true,
        message:
          'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.',
      };
    }

    const token = this.generateToken();
    const TTL_MIN = 30;
    const exp = Date.now() + TTL_MIN * 60 * 1000;

    const store = this.loadResetStore();
    store[token] = { userId: user.id, exp };
    this.saveResetStore(store);

    await this.logActivity(
      user.id,
      ActivityType.EMAIL_SENT,
      'Email de réinitialisation demandé',
      'Demande utilisateur (self-service)',
      { email: user.email }
    );

    return {
      success: true,
      message: 'Lien de réinitialisation généré.',
      devToken: token,
    };
  }

  // --- Mot de passe : reset via token ---
  async resetPassword(payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<BasicResponse> {
    await this.delay(400);

    const { token, password, confirmPassword } = payload;

    if (!token) return { success: false, error: 'Lien invalide.' };
    if (password !== confirmPassword)
      return { success: false, error: 'Les mots de passe ne correspondent pas.' };
    if ((password ?? '').length < 6)
      return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };

    const store = this.loadResetStore();
    const entry = store[token];
    if (!entry) return { success: false, error: 'Lien invalide ou expiré.' };
    if (Date.now() > entry.exp) {
      delete store[token];
      this.saveResetStore(store);
      return { success: false, error: 'Le lien a expiré.' };
    }

    const all = this.users();
    const idx = all.findIndex((u) => u.id === entry.userId);
    if (idx === -1) {
      delete store[token];
      this.saveResetStore(store);
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const updated = { ...all[idx], password, updatedAt: new Date() };
    this.users.update((arr) => {
      const copy = [...arr];
      copy[idx] = updated;
      return copy;
    });

    if (this.currentUser()?.id === updated.id) {
      this.currentUser.set(updated);
      this.persistSession(updated);
    }

    delete store[token];
    this.saveResetStore(store);

    await this.logActivity(
      updated.id,
      ActivityType.PASSWORD_RESET,
      'Mot de passe réinitialisé',
      'Réinitialisation via lien'
    );

    return { success: true, message: 'Mot de passe mis à jour.' };
  }

  // ==============================
  // === Nouvelles fonctionnalités
  // ==============================

  /** Enregistre une activité utilisateur (mock) */
  private async logActivity(
    userId: number,
    type: ActivityType,
    action: string,
    details: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const activity: UserActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      userId,
      type,
      action,
      details,
      metadata,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date(),
    };

    this.activities.update((acts) => [activity, ...acts]);
  }

  /** Récupère l'activité récente d'un utilisateur (admin uniquement) */
  async getUserActivity(userId: number, limit = 10): Promise<UserActivity[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(200);

    return this.getMockActivities()
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /** Envoie un email de réinitialisation de mot de passe (admin) */
  async sendPasswordReset(userId: number): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    const targetUser = this.users().find((u) => u.id === userId);
    if (!targetUser) {
      throw new Error('Utilisateur introuvable');
    }

    await this.delay(500);

    const token = this.generateToken();
    const TTL_MIN = 30;
    const exp = Date.now() + TTL_MIN * 60 * 1000;

    const store = this.loadResetStore();
    store[token] = { userId, exp };
    this.saveResetStore(store);

    await this.logActivity(
      userId,
      ActivityType.EMAIL_SENT,
      'Email de réinitialisation envoyé',
      `Email de réinitialisation envoyé par l'administrateur ${currentUser.firstName} ${currentUser.lastName}`,
      { adminId: currentUser.id, email: targetUser.email }
    );

    // En production: appel d'email provider ici
    // eslint-disable-next-line no-console
    console.log(`Email de réinitialisation envoyé à ${targetUser.email} avec le token: ${token}`);
  }
  private toExtended(u: User | UserExtended): UserExtended {
    const ext = u as Partial<UserExtended>;

    // statut suspendu déduit si besoin
    const hasSuspendedAt =
      typeof ext.suspendedAt !== 'undefined' && String(ext.suspendedAt).trim().length > 0;

    const isActive = typeof ext.isActive === 'boolean' ? ext.isActive : !hasSuspendedAt;

    // normalisation de suspendedAt en Date | undefined
    const suspendedAtNorm =
      typeof ext.suspendedAt === 'string' ? new Date(ext.suspendedAt) : ext.suspendedAt;

    return {
      ...u,
      isActive,
      suspendedAt: suspendedAtNorm,
      suspendedBy: typeof ext.suspendedBy === 'number' ? ext.suspendedBy : undefined,
      suspensionReason: typeof ext.suspensionReason === 'string' ? ext.suspensionReason : undefined,
      lastLoginAt: ext.lastLoginAt ?? undefined,
      lastLoginIp: ext.lastLoginIp ?? undefined,
      loginAttempts: typeof ext.loginAttempts === 'number' ? ext.loginAttempts : 0,
      lockedUntil: ext.lockedUntil ?? undefined,
    };
  }
  /** Suspend ou réactive un compte utilisateur (admin) — no any */
  async toggleUserSuspension(userId: number, reason?: string): Promise<UserExtended> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }
    if (currentUser.id === userId) {
      throw new Error('Vous ne pouvez pas suspendre votre propre compte');
    }

    await this.delay(400);

    const usersArr = this.users();
    const userIndex = usersArr.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('Utilisateur introuvable');
    }

    // ✅ on travaille sur un UserExtended normalisé
    const originalExt = this.toExtended(usersArr[userIndex]);
    const currentlySuspended = this.isSuspended(originalExt);

    const updatedUser: UserExtended = currentlySuspended
      ? {
          // === RÉACTIVER ===
          ...originalExt,
          isActive: true,
          suspendedAt: undefined,
          suspendedBy: undefined,
          suspensionReason: undefined,
          updatedAt: new Date(),
        }
      : {
          // === SUSPENDRE ===
          ...originalExt,
          isActive: false,
          suspendedAt: new Date(),
          suspendedBy: currentUser.id,
          suspensionReason: reason,
          updatedAt: new Date(),
        };

    this.users.update((arr) => {
      const copy = [...arr];
      copy[userIndex] = updatedUser; // OK: UserExtended étend User
      return copy;
    });

    await this.logActivity(
      userId,
      currentlySuspended ? ActivityType.ACCOUNT_REACTIVATED : ActivityType.ACCOUNT_SUSPENDED,
      currentlySuspended ? 'Compte réactivé' : 'Compte suspendu',
      `Compte ${currentlySuspended ? 'réactivé' : 'suspendu'} par l'administrateur ${
        currentUser.firstName
      } ${currentUser.lastName}${reason ? `. Raison: ${reason}` : ''}`,
      { adminId: currentUser.id, reason }
    );

    return updatedUser;
  }

  /** Récupère les commandes d'un utilisateur (admin) */
  async getUserOrders(userId: number): Promise<Order[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(300);

    return this.getMockOrders()
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Récupère les favoris d'un utilisateur (admin) */
  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès refusé : droits administrateur requis');
    }

    await this.delay(200);

    return this.getMockFavorites()
      .filter((favorite) => favorite.userId === userId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /**
   * Données mock enrichies pour le développement
   */
  private getMockUsers(): User[] {
    const baseUsers = this.users();

    const additionalUsers: User[] = [
      {
        id: 3,
        email: 'marie.dupont@email.com',
        firstName: 'Marie',
        lastName: 'Dupont',
        role: UserRole.USER,
        phone: '06 12 34 56 78',
        addresses: [
          {
            street: '45 Avenue des Arts',
            city: 'Lyon',
            postalCode: '69000',
            country: 'France',
            isDefault: true,
          },
        ],
        createdAt: new Date('2024-11-20'),
        updatedAt: new Date('2024-11-25'),
      },
      {
        id: 4,
        email: 'jean.martin@email.com',
        firstName: 'Jean',
        lastName: 'Martin',
        role: UserRole.USER,
        phone: '07 98 76 54 32',
        addresses: [
          {
            street: '78 Boulevard Saint-Germain',
            city: 'Paris',
            postalCode: '75006',
            country: 'France',
            isDefault: true,
          },
        ],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
      },
      {
        id: 5,
        email: 'sophie.bernard@email.com',
        firstName: 'Sophie',
        lastName: 'Bernard',
        role: UserRole.USER,
        phone: '06 55 44 33 22',
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-05'),
      },
      {
        id: 6,
        email: 'pierre.durand@email.com',
        firstName: 'Pierre',
        lastName: 'Durand',
        role: UserRole.ADMIN,
        phone: '01 98 87 76 65',
        addresses: [
          {
            street: '12 Rue Montmartre',
            city: 'Paris',
            postalCode: '75018',
            country: 'France',
            isDefault: true,
          },
        ],
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        id: 7,
        email: 'alice.petit@email.com',
        firstName: 'Alice',
        lastName: 'Petit',
        role: UserRole.USER,
        createdAt: new Date('2024-12-08'),
        updatedAt: new Date('2024-12-08'),
      },
      {
        id: 8,
        email: 'thomas.roux@email.com',
        firstName: 'Thomas',
        lastName: 'Roux',
        role: UserRole.USER,
        phone: '06 11 22 33 44',
        addresses: [
          {
            street: '67 Cours Mirabeau',
            city: 'Aix-en-Provence',
            postalCode: '13100',
            country: 'France',
            isDefault: true,
          },
        ],
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-11-20'),
      },
    ];

    const allUsers = [...baseUsers];
    additionalUsers.forEach((newUser) => {
      if (!allUsers.find((u) => u.email === newUser.email)) {
        allUsers.push(newUser);
      }
    });

    return allUsers;
  }

  // === Mock activités/cmds/favs
  private getMockActivities(): UserActivity[] {
    const now = new Date();
    const activities: UserActivity[] = [];

    [2, 3, 4, 5, 6, 7, 8].forEach((userId) => {
      const userActivities: UserActivity[] = [
        {
          id: `activity-${userId}-login-1`,
          userId,
          type: ActivityType.LOGIN,
          action: 'Connexion réussie',
          details: "L'utilisateur s'est connecté avec succès",
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        },
        {
          id: `activity-${userId}-profile-1`,
          userId,
          type: ActivityType.PROFILE_UPDATE,
          action: 'Profil mis à jour',
          details: 'Modification des informations personnelles',
          metadata: { fields: ['firstName', 'phone'] },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000),
        },
        {
          id: `activity-${userId}-favorite-1`,
          userId,
          type: ActivityType.FAVORITE_ADDED,
          action: 'Produit ajouté aux favoris',
          details: 'iPhone 15 Pro ajouté aux favoris',
          metadata: { productId: 123, productName: 'iPhone 15 Pro' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          timestamp: new Date(now.getTime() - Math.random() * 72 * 60 * 60 * 1000),
        },
      ];
      activities.push(...userActivities);
    });

    return activities;
  }

  private getMockOrders(): Order[] {
    const orders: Order[] = [
      {
        id: 'order-2-001',
        userId: 2,
        status: OrderStatus.DELIVERED,
        total: 1299.99,
        currency: 'EUR',
        items: [
          {
            id: 'item-1',
            productId: 123,
            productName: 'iPhone 15 Pro',
            productImage: 'https://via.placeholder.com/100',
            quantity: 1,
            unitPrice: 1299.99,
            totalPrice: 1299.99,
            sku: 'IPH15PRO-128-BLK',
          },
        ],
        shippingAddress: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: {
          id: 'pm-1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          holder: 'John Doe',
        },
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-05'),
        estimatedDelivery: new Date('2024-12-03'),
        trackingNumber: 'FR123456789',
      },
      {
        id: 'order-3-001',
        userId: 3,
        status: OrderStatus.PROCESSING,
        total: 899.99,
        currency: 'EUR',
        items: [
          {
            id: 'item-2',
            productId: 124,
            productName: 'MacBook Air M2',
            productImage: 'https://via.placeholder.com/100',
            quantity: 1,
            unitPrice: 899.99,
            totalPrice: 899.99,
            sku: 'MBA-M2-256-SLV',
          },
        ],
        shippingAddress: {
          street: '45 Avenue des Arts',
          city: 'Lyon',
          postalCode: '69000',
          country: 'France',
        },
        paymentMethod: {
          id: 'pm-2',
          brand: 'mastercard',
          last4: '5555',
          expMonth: 8,
          expYear: 2026,
          holder: 'Marie Dupont',
        },
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-10'),
      },
    ];

    return orders;
  }

  private getMockFavorites(): UserFavorite[] {
    return [
      {
        id: 'fav-2-1',
        userId: 2,
        productId: 125,
        productName: 'AirPods Pro (2ème génération)',
        productImage: 'https://via.placeholder.com/100',
        productPrice: 279.99,
        addedAt: new Date('2024-12-08'),
        isAvailable: true,
      },
      {
        id: 'fav-2-2',
        userId: 2,
        productId: 126,
        productName: 'iPad Pro 12.9"',
        productImage: 'https://via.placeholder.com/100',
        productPrice: 1449.99,
        addedAt: new Date('2024-12-05'),
        isAvailable: true,
      },
      {
        id: 'fav-3-1',
        userId: 3,
        productId: 127,
        productName: 'Apple Watch Series 9',
        productImage: 'https://via.placeholder.com/100',
        productPrice: 449.99,
        addedAt: new Date('2024-12-07'),
        isAvailable: false,
      },
    ];
  }

  // === Store reset tokens
  private readonly RESET_KEY = 'auth.reset.tokens';

  private loadResetStore(): Record<string, { userId: number; exp: number }> {
    try {
      return JSON.parse(localStorage.getItem(this.RESET_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private saveResetStore(store: Record<string, { userId: number; exp: number }>) {
    localStorage.setItem(this.RESET_KEY, JSON.stringify(store));
  }

  private generateToken(len = 48): string {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
