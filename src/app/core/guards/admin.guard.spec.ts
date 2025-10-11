import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';
import { User, UserRole } from '../../features/auth/models/user.model';

describe('Guard Admin – accès réservé aux administrateurs', () => {
  let toast: jasmine.SpyObj<Pick<ToastService, 'warning' | 'error' | 'success'>>;

  function makeUser(role: UserRole): User {
    return {
      id: 1,
      email: 't@e.st',
      firstName: 'T',
      lastName: 'U',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  beforeEach(() => {
    toast = jasmine.createSpyObj<Pick<ToastService, 'warning' | 'error' | 'success'>>(
      'ToastService',
      ['warning', 'error', 'success']
    );
  });

  function makeState(url: string): RouterStateSnapshot {
    return { url } as unknown as RouterStateSnapshot;
  }

  async function runWithAuth(
    authMock: Pick<AuthService, 'getCurrentUser' | 'isSuspended' | 'logout'>,
    url = '/admin'
  ) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    const route = {} as ActivatedRouteSnapshot;
    const state = makeState(url);

    return TestBed.runInInjectionContext(() => adminGuard(route, state));
  }

  it('Admin connecté → renvoie true', async () => {
    const res = await runWithAuth({
      getCurrentUser: () => makeUser(UserRole.ADMIN),
      isSuspended: () => false,
      logout: () => Promise.resolve(),
    });

    expect(res).toBeTrue();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('Utilisateur non-admin → renvoie UrlTree (refus) + toast erreur', async () => {
    const res = await runWithAuth({
      getCurrentUser: () => makeUser(UserRole.USER),
      isSuspended: () => false,
      logout: () => Promise.resolve(),
    });

    expect(res instanceof UrlTree).toBeTrue();
    expect(toast.error).toHaveBeenCalled();
  });

  it('Non connecté → redirige vers /auth/login?redirect=... + toast warning', async () => {
    const res = await runWithAuth(
      {
        getCurrentUser: () => null,
        isSuspended: () => false,
        logout: () => Promise.resolve(),
      },
      '/admin/orders'
    );

    expect(res instanceof UrlTree).toBeTrue();
    expect(toast.warning).toHaveBeenCalled();
  });

  it('Compte suspendu → logout + redirection login + toast error', async () => {
    const logoutSpy = jasmine.createSpy('logout').and.returnValue(Promise.resolve());
    const res = await runWithAuth({
      getCurrentUser: () => makeUser(UserRole.ADMIN),
      isSuspended: () => true,
      logout: logoutSpy,
    });

    expect(res instanceof UrlTree).toBeTrue();
    expect(logoutSpy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
