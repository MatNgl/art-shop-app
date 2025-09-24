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

    async function runWithAuth(authMock: Pick<AuthService, 'getCurrentUser'>) {
        // Repartir d’un TestBed propre pour chaque cas
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ToastService, useValue: toast },
                { provide: AuthService, useValue: authMock },
            ],
        }).compileComponents();

        const route = {} as ActivatedRouteSnapshot;
        const state = {} as RouterStateSnapshot;
        return TestBed.runInInjectionContext(() => adminGuard(route, state));
    }

    it('Admin connecté → renvoie true', async () => {
        const res = await runWithAuth({ getCurrentUser: () => makeUser(UserRole.ADMIN) });

        expect(res).toBeTrue();
        expect(toast.warning).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('Utilisateur non-admin → renvoie UrlTree (refus) + toast erreur', async () => {
        const res = await runWithAuth({ getCurrentUser: () => makeUser(UserRole.USER) });

        if (res instanceof UrlTree) {
            expect(res instanceof UrlTree).toBeTrue();
            // Optionnel: expect(res.toString()).toBe('/ta-route'); si ton guard redirige
        } else {
            expect(res).toBeFalse(); // si l’impl renvoie false
        }
        expect(toast.error).toHaveBeenCalled(); // message exact selon ton impl
    });
});
