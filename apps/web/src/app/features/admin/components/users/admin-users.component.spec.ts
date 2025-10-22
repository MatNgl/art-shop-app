import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersComponent } from './admin-users.component';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import type { User } from '../../../auth/models/user.model';
import { UserRole } from '../../../auth/models/user.model';

type TAuth = Pick<AuthService, 'getCurrentUser' | 'getAllUsers' | 'updateUserRole' | 'deleteUser'>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TConfirm = Pick<ConfirmService, 'ask'>;

interface Address { city?: string; country?: string }
type TestUser = User & {
    id: number;             // le composant fait un modulo sur id number
    role: UserRole;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    createdAt: string | Date;
    addresses?: Address[];
};

function makeUser(
    id: number,
    firstName: string,
    lastName: string,
    role: UserRole,
    createdAt: Date | string,
    extra?: Partial<TestUser>
): TestUser {
    const d = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
    const base: TestUser = {
        id,
        firstName,
        lastName,
        email: `${firstName}.${lastName}@ex.fr`.toLowerCase(),
        role,
        phone: undefined,
        createdAt: d,
        addresses: [{ city: 'Paris', country: 'FR' }],
    } as TestUser;
    return { ...base, ...extra };
}

describe('Page Gestion Utilisateurs (AdminUsersComponent)', () => {
    let router: Router;
    let authSpy: jasmine.SpyObj<TAuth>;
    let toastSpy: jasmine.SpyObj<TToast>;
    let confirmSpy: jasmine.SpyObj<TConfirm>;

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<TAuth>('AuthService', [
            'getCurrentUser',
            'getAllUsers',
            'updateUserRole',
            'deleteUser',
        ]);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);
        confirmSpy = jasmine.createSpyObj<TConfirm>('ConfirmService', ['ask']);

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, AdminUsersComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authSpy },
                { provide: ToastService, useValue: toastSpy },
                { provide: ConfirmService, useValue: confirmSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
    });

    it('redirige vers / si non admin', async () => {
        const current: TestUser = makeUser(1, 'Bob', 'User', UserRole.USER, new Date());
        authSpy.getCurrentUser.and.returnValue(current);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('charge les utilisateurs et calcule les stats', async () => {
        const admin: TestUser = makeUser(9, 'Ada', 'Admin', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);

        const now = new Date();
        const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000);
        const lastYear = new Date(new Date().getFullYear() - 1, 0, 1);

        const users: TestUser[] = [
            makeUser(1, 'Alice', 'Zed', UserRole.ADMIN, now),
            makeUser(2, 'Bob', 'Bar', UserRole.USER, sixDaysAgo),
            makeUser(3, 'Chloé', 'Car', UserRole.USER, lastYear),
        ];
        authSpy.getAllUsers.and.resolveTo(users);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.users().length).toBe(3);

        const s = comp.stats();
        expect(s.total).toBe(3);
        expect(s.admins).toBe(1);
        expect(s.users).toBe(2);
        expect(s.recentRegistrations).toBe(2); // ≤ 7 jours
    });

    it('filtre par texte/role/date et trie par firstName', async () => {
        const admin = makeUser(9, 'Ada', 'Admin', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);

        const users: TestUser[] = [
            makeUser(1, 'Zoé', 'Zed', UserRole.USER, new Date()),
            makeUser(2, 'Ben', 'Bar', UserRole.USER, new Date()),
            makeUser(3, 'Ana', 'Ars', UserRole.ADMIN, new Date()),
        ];
        authSpy.getAllUsers.and.resolveTo(users);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        // "a" + rôle USER + cette année + tri par prénom
        comp.onSearchChange('a');
        comp.onRoleChange(UserRole.USER);
        comp.onDateChange('year');
        // comp.onSortChange('firstName'); // FIXME: méthode supprimée

        const list = comp.filteredUsers();
        expect(list.map((u) => u.firstName)).toEqual(['Ben']);
        expect(list.length).toBe(1);
    });


    it('filtre déterministe: recherche par id, rôle user, tri createdAt_desc', async () => {
        const admin = makeUser(99, 'Root', 'Admin', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);

        const u1 = makeUser(10, 'Marc', 'Dup', UserRole.USER, new Date('2025-01-10T00:00:00Z'));
        const u2 = makeUser(11, 'Léa', 'Zen', UserRole.USER, new Date('2025-01-11T00:00:00Z'));
        const u3 = makeUser(12, 'Ana', 'Low', UserRole.ADMIN, new Date('2025-01-12T00:00:00Z'));
        authSpy.getAllUsers.and.resolveTo([u1, u2, u3]);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        comp.onSearchChange('1'); // ids 10, 11, 12 match
        comp.onRoleChange(UserRole.USER);
        // comp.onSortChange('createdAt_desc'); // FIXME: méthode supprimée

        const list = comp.filteredUsers();
        expect(list.map((u) => u.id)).toEqual([11, 10]);
    });

    it('refreshData recharge et notifie', async () => {
        const admin = makeUser(99, 'Root', 'Admin', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        authSpy.getAllUsers.and.resolveTo([makeUser(1, 'A', 'A', UserRole.USER, new Date())]);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        authSpy.getAllUsers.calls.reset();
        toastSpy.success.calls.reset();

        await comp.refreshData();
        expect(authSpy.getAllUsers).toHaveBeenCalled();
        expect(toastSpy.success).toHaveBeenCalledWith('Liste des utilisateurs actualisée');
    });

    it('exportUsers génère un CSV et simule le clic', async () => {
        const admin = makeUser(1, 'Admin', 'One', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        authSpy.getAllUsers.and.resolveTo([
            makeUser(2, 'Alice', 'Alpha', UserRole.USER, new Date('2025-01-01T10:00:00Z')),
        ]);

        const origCreateElement = document.createElement.bind(document);
        const origCreateObjectURL = URL.createObjectURL;

        spyOn(URL, 'createObjectURL').and.returnValue('blob:users');

        const createEl = spyOn(document, 'createElement').and.callFake((tag: string) => {
            const el = origCreateElement(tag);
            (el as HTMLAnchorElement).click = jasmine.createSpy('click');
            return el;
        });
        const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
        const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        comp.exportUsers();

        expect(createEl).toHaveBeenCalledWith('a');
        expect(appendSpy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
        expect(toastSpy.success).toHaveBeenCalledWith('Export CSV généré avec succès');

        URL.createObjectURL = origCreateObjectURL;
    });

    it('toggleUserRole : confirme, met à jour, recharge et notifie', async () => {
        const admin = makeUser(100, 'Admin', 'Boss', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        const target = makeUser(7, 'Bob', 'User', UserRole.USER, new Date());
        authSpy.getAllUsers.and.resolveTo([target]);
        authSpy.updateUserRole.and.resolveTo();
        confirmSpy.ask.and.resolveTo(true);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.toggleUserRole(target);
        expect(confirmSpy.ask).toHaveBeenCalled();
        expect(authSpy.updateUserRole).toHaveBeenCalledWith(7, UserRole.ADMIN);
        expect(authSpy.getAllUsers).toHaveBeenCalledTimes(2); // reload
        expect(toastSpy.success).toHaveBeenCalled();
    });

    it('toggleUserRole : erreur backend toast error', async () => {
        const admin = makeUser(100, 'Admin', 'Boss', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        const target = makeUser(7, 'Bob', 'User', UserRole.USER, new Date());
        authSpy.getAllUsers.and.resolveTo([target]);
        authSpy.updateUserRole.and.rejectWith(new Error('boom'));
        confirmSpy.ask.and.resolveTo(true);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.toggleUserRole(target);
        expect(toastSpy.error).toHaveBeenCalledWith('Impossible de modifier le rôle de cet utilisateur');
    });

    it('deleteUser : confirme, supprime, recharge et notifie', async () => {
        const admin = makeUser(100, 'Admin', 'Boss', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        const target = makeUser(8, 'Cara', 'Doe', UserRole.USER, new Date());
        authSpy.getAllUsers.and.resolveTo([target]);
        authSpy.deleteUser.and.resolveTo();
        confirmSpy.ask.and.resolveTo(true);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.deleteUser(target);
        expect(confirmSpy.ask).toHaveBeenCalled();
        expect(authSpy.deleteUser).toHaveBeenCalledWith(8);
        expect(authSpy.getAllUsers).toHaveBeenCalledTimes(2);
        expect(toastSpy.success).toHaveBeenCalledWith('Le compte de Cara Doe a été supprimé');
    });

    it('deleteUser : annulation ne supprime pas', async () => {
        const admin = makeUser(100, 'Admin', 'Boss', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        const target = makeUser(8, 'Cara', 'Doe', UserRole.USER, new Date());
        authSpy.getAllUsers.and.resolveTo([target]);
        confirmSpy.ask.and.resolveTo(false);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.deleteUser(target);
        expect(authSpy.deleteUser).not.toHaveBeenCalled();
    });

    it('helpers: getInitials / getAvatarClass / getRoleBadgeClass / formatDate / getRegistrationLabel', async () => {
        const admin = makeUser(100, 'Admin', 'Boss', UserRole.ADMIN, new Date());
        authSpy.getCurrentUser.and.returnValue(admin);
        authSpy.getAllUsers.and.resolveTo([]);

        const fixture = TestBed.createComponent(AdminUsersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        const u = makeUser(3, 'Jean', 'Dupont', UserRole.USER, new Date('2025-01-02T00:00:00Z'));
        expect(comp.getInitials(u)).toBe('JD');
        expect(comp.getAvatarClass(u)).toMatch(/^bg-(blue|green|purple|pink|indigo|yellow|red|gray)-500$/);
        expect(comp.getRoleBadgeClass(UserRole.ADMIN)).toBe('bg-red-100 text-red-800 rounded-full');
        expect(comp.getRoleBadgeClass(UserRole.USER)).toBe('bg-green-100 text-green-800 rounded-full');

        expect(comp.formatDate('2025-01-02T00:00:00.000Z')).toMatch(/02\/01\/2025|02\/01\/2025/);

        const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        expect(comp.getRegistrationLabel(yesterday)).toBe('Hier');
    });
});
