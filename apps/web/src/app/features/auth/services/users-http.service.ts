import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';

interface SuspendUserPayload {
  reason: string;
  suspendedBy: string;
}

interface UserStatsResponse {
  total: number;
  active: number;
  suspended: number;
  admins: number;
}

@Injectable({ providedIn: 'root' })
export class UsersHttpService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * GET ALL USERS - Récupérer tous les utilisateurs (admin)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await firstValueFrom(
        this.http.get<User[]>(`${this.API_URL}/users`)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  /**
   * GET USER BY ID - Récupérer un utilisateur par ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await firstValueFrom(
        this.http.get<User>(`${this.API_URL}/users/${id}`)
      );
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
      return null;
    }
  }

  /**
   * UPDATE USER - Mettre à jour un utilisateur (admin)
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await firstValueFrom(
        this.http.patch<User>(`${this.API_URL}/users/${id}`, updates)
      );
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error);
      return null;
    }
  }

  /**
   * SUSPEND USER - Suspendre un utilisateur
   */
  async suspendUser(id: string, reason: string, suspendedBy: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/users/${id}/suspend`, {
          reason,
          suspendedBy,
        } as SuspendUserPayload)
      );
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suspension de l'utilisateur ${id}:`, error);
      return false;
    }
  }

  /**
   * REACTIVATE USER - Réactiver un utilisateur suspendu
   */
  async reactivateUser(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/users/${id}/reactivate`, {})
      );
      return true;
    } catch (error) {
      console.error(`Erreur lors de la réactivation de l'utilisateur ${id}:`, error);
      return false;
    }
  }

  /**
   * DELETE USER - Supprimer un utilisateur
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/users/${id}`)
      );
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error);
      return false;
    }
  }

  /**
   * GET STATS - Récupérer les statistiques utilisateurs
   */
  async getStats(): Promise<UserStatsResponse> {
    try {
      return await firstValueFrom(
        this.http.get<UserStatsResponse>(`${this.API_URL}/users/stats`)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return { total: 0, active: 0, suspended: 0, admins: 0 };
    }
  }
}
