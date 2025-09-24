import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

describe('Garde d’authentification (authGuard)', () => {
    let router: Router;
    let toast: jasmine.SpyObj<Pick<ToastService, 'requireAuth'>>;

    beforeEach(() => {
        toast = jasmine.createSpyObj<Pick<ToastService, 'requireAuth'>>('ToastService', ['requireAuth']);
    });

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

        router = TestBed.inject(Router); // requis pour createUrlTree à l’interne

        const route = {} as unknown as ActivatedRouteSnapshot;
        const state = { url } as unknown as RouterStateSnapshot;

        return TestBed.runInInjectionContext(() => authGuard(route, state));
    }

    it('retourne true si un utilisateur est déjà connecté', () => {
        const res = runGuard({ id: 1 }, '/profile');
        expect(res).toBeTrue();
        expect(toast.requireAuth).not.toHaveBeenCalled();
    });

    it('retourne un UrlTree vers /auth/login si non connecté, avec returnUrl et toast contextuel', () => {
        const res = runGuard(null, '/favorites') as UrlTree;

        expect(res instanceof UrlTree).toBeTrue();
        const tree = router.serializeUrl(res);
        expect(tree).toContain('/auth/login');
        expect(tree).toContain('returnUrl=%2Ffavorites');

        expect(toast.requireAuth).toHaveBeenCalledWith('favorites', '/favorites');
    });

    it('détermine correctement le contexte (cart / favorites / profile) selon l’URL', () => {
        runGuard(null, '/cart');
        expect(toast.requireAuth).toHaveBeenCalledWith('cart', '/cart');

        toast.requireAuth.calls.reset();
        runGuard(null, '/favorites');
        expect(toast.requireAuth).toHaveBeenCalledWith('favorites', '/favorites');

        toast.requireAuth.calls.reset();
        runGuard(null, '/autre-truc');
        expect(toast.requireAuth).toHaveBeenCalledWith('profile', '/autre-truc');
    });
});
