import { Injectable, signal } from '@angular/core';
import { User, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users = signal<User[]>([
    {
      id: 1,
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Matthéo',
      lastName: 'Naegellen',
      role: UserRole.ADMIN,
      phone: '+33 6 11 22 33 44',
      address: {
        street: '1 Rue de la Paix',
        city: 'Paris',
        postalCode: '75002',
        country: 'FR',
      },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    },
    {
      id: 2,
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Nathan',
      lastName: 'Naegellen',
      role: UserRole.USER,
      phone: '+33 6 55 44 33 22',
      address: {
        street: '10 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'FR',
      },
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-06-02T00:00:00Z'),
    },
  ]);

  private currentUser = signal<User | null>(null);
  /** 🔎 Pour le header (read-only) */
  public readonly currentUser$ = this.currentUser.asReadonly();

  constructor() {
    // 🔁 Restaurer la session au démarrage (et re-hydrater les dates)
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        this.currentUser.set(parsed);
      } catch {
        /* ignore */
      }
    }
  }

  // --- Utils ---
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  private persistSession(user: User | null) {
    if (user) {
      const { ...sessionUser } = user;
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  // --- Token pour l'intercepteur ---
  getToken(): string | null {
    const user = this.currentUser();
    return user ? `mock-token-${user.id}` : null; // token factice
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

  async getAllUsers(): Promise<User[]> {
    await this.delay(300);
    if (!this.isAdmin()) throw new Error('Accès non autorisé');
    // retourne une copie (pas de password dans User)
    return this.users().map((u) => ({ ...u }));
  }

  async deleteUser(userId: number): Promise<void> {
    await this.delay(200);

    const exists = this.users().some((u) => u.id === userId);
    if (!exists) throw new Error('Utilisateur non trouvé');

    this.users.update((arr) => arr.filter((u) => u.id !== userId));

    if (this.currentUser()?.id === userId) {
      await this.logout();
    }
  }
}
