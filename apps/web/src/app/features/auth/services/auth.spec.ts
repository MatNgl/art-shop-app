// src/app/features/auth/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { UserRole, Address } from '../models/user.model';

describe('AuthService – scénarios d’authentification et d’admin', () => {
  let service: AuthService;

  beforeEach(() => {
    // Stub localStorage pour éviter tout état persistant
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem').and.stub();
    spyOn(localStorage, 'removeItem').and.stub();

    // Très important: repartir d’un TestBed vierge à chaque test
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('création du service', () => {
    expect(service).toBeTruthy();
  });

  it('register → crée un utilisateur et le connecte', async () => {
    const now = Date.now();
    const email = `test${now}@example.com`;

    const res = await service.register({
      email,
      password: 'Password1A',
      confirmPassword: 'Password1A',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.success).toBeTrue();
    expect(res.user?.email).toBe(email);
    expect(service.getCurrentUser()?.email).toBe(email);
  });

  it('register → refuse un email déjà utilisé', async () => {
    const existing = 'user@example.com';
    const res = await service.register({
      email: existing,
      password: 'Password1A',
      confirmPassword: 'Password1A',
      firstName: 'X',
      lastName: 'Y',
    });
    expect(res.success).toBeFalse();
    expect(res.error).toContain('déjà utilisé');
  });

  it('login → succès avec identifiants valides', async () => {
    const res = await service.login({ email: 'user@example.com', password: 'user123' });
    expect(res.success).toBeTrue();
    expect(res.user).toBeDefined();
    expect(service.getToken()).toMatch(/^mock-token-\d+/);
  });

  it('login → échec avec identifiants invalides', async () => {
    const res = await service.login({ email: 'noone@example.com', password: 'x' });
    expect(res.success).toBeFalse();
    expect(res.error).toBeDefined();
  });

  it('logout → nettoie user et token', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });
    expect(service.getCurrentUser()).toBeTruthy();

    await service.logout();

    expect(service.getCurrentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('isAdmin → true pour admin, false pour user', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    expect(service.isAdmin()).toBeTrue();

    // Nouveau cycle propre (mais comme on reset TestBed à chaque test, ce test reste simple)
    await service.logout();
    await service.login({ email: 'user@example.com', password: 'user123' });
    expect(service.isAdmin()).toBeFalse();
  });

  it('getAllUsers (admin) → liste non vide', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    const list = await service.getAllUsers();
    expect(Array.isArray(list)).toBeTrue();
    expect(list.length).toBeGreaterThan(0);
  });

  it('getAllUsers / updateUserRole → rejet si non-admin', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });
    await expectAsync(service.getAllUsers()).toBeRejected();
    await expectAsync(service.updateUserRole(2, UserRole.ADMIN)).toBeRejected();
  });

  it('updateUserRole → interdit de modifier son propre rôle', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    const self = service.getCurrentUser()!;
    await expectAsync(service.updateUserRole(self.id, UserRole.USER)).toBeRejectedWithError(
      'Vous ne pouvez pas modifier votre propre rôle'
    );
  });

  it('deleteUser → interdit de supprimer son propre compte', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    const self = service.getCurrentUser()!;
    await expectAsync(service.deleteUser(self.id)).toBeRejectedWithError(
      'Vous ne pouvez pas supprimer votre propre compte'
    );
  });

  it('deleteUser → peut supprimer un autre admin tant qu’il en reste ≥ 1', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    // On promeut l’utilisateur 2 en admin pour assurer 2 admins (1 et 2)
    await service.updateUserRole(2, UserRole.ADMIN);
    await expectAsync(service.deleteUser(2)).toBeResolved(); // il reste l’admin 1
  });

  it('changePassword → succès puis ancien mdp refusé', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });
    await service.changePassword({ currentPassword: 'user123', newPassword: 'NewPass1A' });

    await expectAsync(
      service.changePassword({ currentPassword: 'user123', newPassword: 'Another1A' })
    ).toBeRejectedWithError('Mot de passe actuel incorrect');
  });

  it('changePassword → rejette si mdp actuel incorrect', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });

    await expectAsync(
      service.changePassword({ currentPassword: 'bad', newPassword: 'Valid1Aaa' })
    ).toBeRejectedWithError('Mot de passe actuel incorrect');
  });

  it('changePassword → rejette si nouveau mdp non conforme', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });

    await expectAsync(
      service.changePassword({ currentPassword: 'user123', newPassword: 'short' })
    ).toBeRejectedWithError('Le nouveau mot de passe ne respecte pas les critères');
  });

  it('updateProfile → fusionne les champs + address par défaut', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });

    const patch = {
      firstName: 'NewFirst',
      address: {
        street: '12 rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      } as Partial<Address>,
    };

    await service.updateProfile(patch);

    const u = service.getCurrentUser()!;
    expect(u.firstName).toBe('NewFirst');
    expect(u.addresses?.[0]).toEqual(jasmine.objectContaining({
      street: '12 rue de Paris',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      isDefault: true,
    }));
  });

  it('getUserDetails (admin) → renvoie un utilisateur existant (via mocks de lecture)', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    const user = await service.getUserDetails(3);
    expect(user).toBeDefined();
    expect(user.id).toBe(3);
  });

  it('updateUserInfo (admin) → met à jour des champs ciblés (ID existant dans le signal)', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });

    // IMPORTANT : id=2 est bien présent dans this.users() (pas seulement dans getMockUsers)
    const updated = await service.updateUserInfo(2, { lastName: 'Modifié' });
    expect(updated.id).toBe(2);
    expect(updated.lastName).toBe('Modifié');
  });

  it('getUserStats (admin) → agrégats cohérents', async () => {
    await service.login({ email: 'admin@example.com', password: 'admin123' });
    const stats = await service.getUserStats();

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.admins).toBeGreaterThan(0);
    expect(stats.users).toBeGreaterThan(0);
    expect(stats.recentRegistrations).toBeGreaterThanOrEqual(0);
    expect(stats.registrationsThisMonth).toBeGreaterThanOrEqual(0);
  });
});
