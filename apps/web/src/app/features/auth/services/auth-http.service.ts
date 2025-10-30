import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken?: string;
  error?: string;
}

interface ProfilePatch {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:3000/api';

  // Signal pour l'utilisateur connecté
  private currentUser = signal<User | null>(null);
  public readonly currentUser$ = this.currentUser.asReadonly();

  constructor() {
    // Restaurer la session au démarrage
    this.restoreSession();
  }

  /**
   * Restaurer l'utilisateur depuis localStorage
   */
  private restoreSession(): void {
    const userJson = localStorage.getItem('currentUser');
    const token = localStorage.getItem('accessToken');

    if (userJson && token) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUser.set(user);
      } catch {
        this.clearSession();
      }
    }
  }

  /**
   * Sauvegarder la session
   */
  private persistSession(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    this.currentUser.set(user);
  }

  /**
   * Effacer la session
   */
  private clearSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    this.currentUser.set(null);
  }

  /**
   * Récupérer le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * LOGIN - Connexion utilisateur
   */
  async login(credentials: LoginRequest): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, {
          email: credentials.email,
          password: credentials.password,
        })
      );

      if (response.success && response.user && response.accessToken) {
        this.persistSession(response.user, response.accessToken);
        return { success: true, user: response.user };
      }

      return { success: false, error: response.error || 'Erreur de connexion' };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Email ou mot de passe incorrect';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * REGISTER - Inscription utilisateur
   */
  async register(userData: RegisterRequest): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
        })
      );

      if (response.success && response.user && response.accessToken) {
        this.persistSession(response.user, response.accessToken);
        return { success: true, user: response.user };
      }

      return { success: false, error: response.error || 'Erreur d\'inscription' };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors de l\'inscription';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * LOGOUT - Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/auth/logout`, {}));
    } catch {
      // Même si l'API échoue, on déconnecte côté client
    } finally {
      this.clearSession();
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * GET PROFILE - Récupérer le profil utilisateur depuis l'API
   */
  async getProfile(): Promise<User | null> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${this.API_URL}/auth/me`)
      );

      if (user) {
        // Mettre à jour le localStorage avec les données fraîches
        const token = this.getToken();
        if (token) {
          this.persistSession(user, token);
        }
      }

      return user;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * CHANGE PASSWORD - Changer le mot de passe
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.API_URL}/auth/change-password`, payload)
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors du changement de mot de passe';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * UPDATE PROFILE - Mettre à jour le profil
   */
  async updateProfile(updates: ProfilePatch): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = await firstValueFrom(
        this.http.patch<User>(`${this.API_URL}/auth/profile`, updates)
      );

      if (user) {
        const token = this.getToken();
        if (token) {
          this.persistSession(user, token);
        }
        return { success: true, user };
      }

      return { success: false, error: 'Erreur de mise à jour' };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors de la mise à jour du profil';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * HELPERS
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null && this.getToken() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  /**
   * RESET PASSWORD - Réinitialiser le mot de passe avec token
   */
  async resetPassword(payload: { token: string; password: string; confirmPassword: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/auth/reset-password`, payload)
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors de la réinitialisation du mot de passe';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * GET ALL USERS - Récupérer tous les utilisateurs (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await firstValueFrom(
        this.http.get<User[]>(`${this.API_URL}/users`)
      );
      return users;
    } catch {
      return [];
    }
  }

  /**
   * DELETE USER - Supprimer un utilisateur (admin only)
   */
  async deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/users/${userId}`)
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors de la suppression';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * SEND PASSWORD RESET - Envoyer email de réinitialisation (admin only)
   */
  async sendPasswordReset(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/users/${userId}/send-password-reset`, {})
      );
      return { success: true };
    } catch (error: unknown) {
      const errorMsg = (error as { error?: { message?: string } })?.error?.message || 'Erreur lors de l\'envoi';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * TOGGLE USER SUSPENSION - Suspendre/Réactiver un utilisateur (admin only)
   */
  async toggleUserSuspension(userId: number, suspend: boolean, reason?: string): Promise<User | null> {
    try {
      const user = await firstValueFrom(
        this.http.patch<User>(`${this.API_URL}/users/${userId}/suspension`, {
          suspend,
          reason
        })
      );
      return user;
    } catch {
      return null;
    }
  }

  /**
   * UPDATE USER - Mettre à jour un utilisateur (admin only)
   */
  async updateUser(userId: number, updates: Partial<User>): Promise<User | null> {
    try {
      const user = await firstValueFrom(
        this.http.patch<User>(`${this.API_URL}/users/${userId}`, updates)
      );
      return user;
    } catch {
      return null;
    }
  }

  /**
   * GET USER BY ID - Récupérer un utilisateur par ID (admin only)
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${this.API_URL}/users/${userId}`)
      );
      return user;
    } catch {
      return null;
    }
  }

  /**
   * UPDATE USER ROLE - Changer le rôle d'un utilisateur (admin only)
   */
  async updateUserRole(userId: number, role: string): Promise<User | null> {
    return this.updateUser(userId, { role });
  }

  /**
   * GET USER ACTIVITY - Récupérer l'activité d'un utilisateur (admin only)
   */
  async getUserActivity(userId: number): Promise<any> {
    try {
      const activity = await firstValueFrom(
        this.http.get(`${this.API_URL}/users/${userId}/activity`)
      );
      return activity;
    } catch {
      return null;
    }
  }

  /**
   * GET USER DETAILS - Récupérer les détails complets d'un utilisateur (admin only)
   */
  async getUserDetails(userId: number): Promise<User | null> {
    return this.getUserById(userId);
  }

  /**
   * GET USER STATS - Récupérer les statistiques des utilisateurs (admin only)
   */
  async getUserStats(): Promise<any> {
    try {
      const stats = await firstValueFrom(
        this.http.get(`${this.API_URL}/users/stats`)
      );
      return stats;
    } catch {
      return null;
    }
  }
}
