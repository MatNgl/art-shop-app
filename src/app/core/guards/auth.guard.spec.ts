import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

describe('Garde d’authentification (authGuard)', () => {
  let toast: jasmine.SpyObj<Pick<ToastService, 'requireAuth'>>;

  beforeEach(() => {
    toast = jasmine.createSpyObj<Pick<ToastService, 'requireAuth'>>('ToastService', [
      'requireAuth',
    ]);
  });

  function makeState(url: string): RouterStateSnapshot {
    return { url } as unknown as RouterStateSnapshot;
  }

  function runGuard(currentUser: unknown, url: string) {
    const authMock: Pick<AuthService, 'getCurrentUser'> = {
      getCurrentUser: () => currentUser as ReturnType<AuthService['getCurrentUser']>,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toast },
      ],
    });

    const route = {} as ActivatedRouteSnapshot;
    const state = makeState(url);

    return TestBed.runInInjectionContext(() => authGuard(route, state));
  }

  it('retourne true si un utilisateur est déjà connecté', () => {
    const res = runGuard({ id: 1, role: 'user' }, '/profile');
    expect(res).toBeTrue();
    expect(toast.requireAuth).not.toHaveBeenCalled();
  });

  it('redirige vers /auth/login?returnUrl=... et déclenche un toast si non connecté', () => {
    const res = runGuard(null, '/favorites');
    expect(res instanceof UrlTree).toBeTrue();
    expect(toast.requireAuth).toHaveBeenCalledWith('favorites', '/favorites');
  });

  it('détermine le contexte cart/favorites/profile selon l’URL', () => {
    runGuard(null, '/cart');
    expect(toast.requireAuth).toHaveBeenCalledWith('cart', '/cart');

    toast.requireAuth.calls.reset();
    runGuard(null, '/favorites');
    expect(toast.requireAuth).toHaveBeenCalledWith('favorites', '/favorites');

    toast.requireAuth.calls.reset();
    runGuard(null, '/autre');
    expect(toast.requireAuth).toHaveBeenCalledWith('profile', '/autre');
  });
});
