import { Injectable, signal } from '@angular/core';
import { User, LoginRequest, RegisterRequest, UserRole, Address } from '../models/user.model';

// Patch type for profile updates (no required fields)
type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>> & {
  address?: Partial<Address>;
};

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
      addresses: [{
        street: '1 Rue de la Paix',
        city: 'Paris',
        postalCode: '75002',
        country: 'FR',
        isDefault: true,
      }],
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
      addresses: [{
        street: '10 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'FR',
        isDefault: true,
      }],
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-06-02T00:00:00Z'),
    },
  ]);

  private currentUser = signal<User | null>(null);
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

    if (!user) return { success: false, error: 'Email ou mot de passe incorrect' };

    this.currentUser.set(user);
    this.persistSession(user);
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

    return { success: true, user: newUser };
  }

  async logout(): Promise<void> {
    await this.delay(200);
    this.currentUser.set(null);
    this.persistSession(null);
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
      // TODO: remplacer par votre vraie API
      // const response = await fetch('/api/admin/users', {
      //   method: 'GET',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // const users: User[] = await response.json();
      // return users;

      // En attendant l'API, retourner les données mock enrichies
      return this.getMockUsers();
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      // Données de fallback pour le développement
      return this.getMockUsers();
    }
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
      // TODO: remplacer par votre vraie API
      // const response = await fetch(`/api/admin/users/${userId}/role`, {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ role: newRole }),
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // const updatedUser: User = await response.json();
      // return updatedUser;

      // Simulation pour le développement avec les données mock en mémoire
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
      // TODO: remplacer par votre vraie API
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // Simulation : supprimer des données mock
      this.users.update((arr) => arr.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Erreur lors de la suppression utilisateur:', error);
      throw error;
    }
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
      // TODO: remplacer par votre vraie API
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: 'GET',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // const user: User = await response.json();
      // return user;

      // Fallback avec données mock
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
      // TODO: remplacer par votre vraie API
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(updates),
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // const updatedUser: User = await response.json();
      // return updatedUser;

      // Simulation avec données mock
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

      // Mettre à jour le signal
      this.users.update((arr) => {
        const copy = [...arr];
        copy[userIndex] = updatedUser;
        return copy;
      });

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
      // TODO: remplacer par votre vraie API
      // const response = await fetch('/api/admin/users/stats', {
      //   method: 'GET',
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`Erreur HTTP: ${response.status}`);
      // }

      // const stats = await response.json();
      // return stats;

      // Calcul avec les données mock
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

    // Extraire pour éviter la variable non utilisée et faciliter le merge
    const { address, ...rest } = patch;

    // Merge de l'adresse garantissant des strings si address existe
    let mergedAddress: Address | undefined = (u.addresses?.find(a => a.isDefault) ?? u.addresses?.[0]);
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

    // Mettre à jour l'utilisateur courant + persistance
    this.currentUser.set(updated);
    this.persistSession(updated);

    // Mettre à jour la liste mock "users" si l'utilisateur existe
    this.users.update((arr) => {
      const idx = arr.findIndex((x) => x.id === u.id);
      if (idx === -1) return arr;
      const copy = [...arr];
      copy[idx] = { ...copy[idx], ...updated };
      return copy;
    });
  }

  /**
   * Données mock enrichies pour le développement
   */
  private getMockUsers(): User[] {
    const baseUsers = this.users();

    // Ajouter quelques utilisateurs supplémentaires pour enrichir les tests
    const additionalUsers: User[] = [
      {
        id: 3,
        email: 'marie.dupont@email.com',
        firstName: 'Marie',
        lastName: 'Dupont',
        role: UserRole.USER,
        phone: '06 12 34 56 78',
        addresses: [{
          street: '45 Avenue des Arts',
          city: 'Lyon',
          postalCode: '69000',
          country: 'France',
          isDefault: true,
        }],
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
        addresses: [{
          street: '78 Boulevard Saint-Germain',
          city: 'Paris',
          postalCode: '75006',
          country: 'France',
          isDefault: true,
        }],
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
        addresses: [{
          street: '12 Rue Montmartre',
          city: 'Paris',
          postalCode: '75018',
          country: 'France',
          isDefault: true,
        }],
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
        addresses: [{
          street: '67 Cours Mirabeau',
          city: 'Aix-en-Provence',
          postalCode: '13100',
          country: 'France',
          isDefault: true,
        }],
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-11-20'),
      },
    ];

    // Fusionner avec les utilisateurs existants (éviter les doublons par email)
    const allUsers = [...baseUsers];
    additionalUsers.forEach((newUser) => {
      if (!allUsers.find((u) => u.email === newUser.email)) {
        allUsers.push(newUser);
      }
    });

    return allUsers;
  }
}
