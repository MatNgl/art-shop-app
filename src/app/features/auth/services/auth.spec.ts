import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { UserRole } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register a new user and set currentUser', async () => {
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
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe(email);
    expect(service.getCurrentUser()?.email).toBe(email);
  });

  it('should not register with existing email', async () => {
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

  it('should login with valid credentials', async () => {
    const res = await service.login({ email: 'user@example.com', password: 'user123' });
    expect(res.success).toBeTrue();
    expect(res.user).toBeDefined();
    expect(service.getToken()).toMatch(/mock-token-/);
  });

  it('should fail login with invalid credentials', async () => {
    const res = await service.login({ email: 'noone@example.com', password: 'x' });
    expect(res.success).toBeFalse();
    expect(res.error).toBeDefined();
  });

  it('should logout and clear current user and token', async () => {
    await service.login({ email: 'user@example.com', password: 'user123' });
    expect(service.getCurrentUser()).toBeTruthy();
    await service.logout();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('admin-only methods should throw when not admin', async () => {
    await service.logout();
    // ensure logged in as non-admin
    await service.login({ email: 'user@example.com', password: 'user123' });
    await expectAsync(service.getAllUsers()).toBeRejected();
    await expectAsync(service.updateUserRole(2, UserRole.ADMIN)).toBeRejected();
  });
});
