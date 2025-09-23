import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';
import { User, UserRole } from '../../features/auth/models/user.model';

describe('adminGuard', () => {
    let toast: jasmine.SpyObj<ToastService>;

    beforeEach(() => {
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['warning', 'error', 'success']);
    });

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

    async function runGuardWithUser(role: UserRole) {
        const authMock: Pick<AuthService, 'getCurrentUser'> = {
            getCurrentUser: () => makeUser(role),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                { provide: ToastService, useValue: toast },
                { provide: AuthService, useValue: authMock },
            ],
        });

        const route = {} as ActivatedRouteSnapshot;
        const state = {} as RouterStateSnapshot;
        return TestBed.runInInjectionContext(() => adminGuard(route, state));
    }

    it('returns true for admin user', async () => {
        const res = await runGuardWithUser(UserRole.ADMIN);
        expect(res).toBeTrue();
        expect(toast.warning).not.toHaveBeenCalled();
    });

    it('blocks non-admin users (returns UrlTree or false)', async () => {
        const res = await runGuardWithUser(UserRole.USER);
        expect(res).not.toBeTrue();
        expect(toast.error).toHaveBeenCalled();
    });
});
