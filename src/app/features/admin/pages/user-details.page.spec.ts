import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';

import { UserDetailsPage } from './user-details.page';
import { AuthService } from '../../auth/services/auth';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { User, UserRole } from '../../auth/models/user.model';

describe("Page Détails d'utilisateur (UserDetailsPage)", () => {
    let fixture: ComponentFixture<UserDetailsPage>;
    let component: UserDetailsPage;
    let router: Router;

    // --- Doubles strictement typés ---
    let auth: jasmine.SpyObj<
        Pick<AuthService, 'getCurrentUser' | 'getUserDetails' | 'updateUserRole' | 'deleteUser'>
    >;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'error' | 'info'>>;
    let confirm: jasmine.SpyObj<Pick<ConfirmService, 'ask'>>;

    // --- Données utilitaires ---
    const ADMIN: User = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Root',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
    };

    const TARGET_USER: User = {
        id: 42,
        email: 'user42@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        role: UserRole.USER,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-07-01'),
    };

    function setupTestWithRouteId(idValue: string) {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [UserDetailsPage],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: auth },
                { provide: ToastService, useValue: toast },
                { provide: ConfirmService, useValue: confirm },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ id: idValue }) } },
                },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(UserDetailsPage);
        component = fixture.componentInstance;
        // Pas besoin de detectChanges() : on pilote ngOnInit() manuellement
    }

    beforeEach(() => {
        auth = jasmine.createSpyObj<
            Pick<AuthService, 'getCurrentUser' | 'getUserDetails' | 'updateUserRole' | 'deleteUser'>
        >('AuthService', ['getCurrentUser', 'getUserDetails', 'updateUserRole', 'deleteUser']);

        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error' | 'info'>>(
            'ToastService',
            ['success', 'error', 'info']
        );

        confirm = jasmine.createSpyObj<Pick<ConfirmService, 'ask'>>('ConfirmService', ['ask']);
    });

    it('se crée correctement', () => {
        setupTestWithRouteId('42');
        expect(component).toBeTruthy();
    });

    it("ngOnInit → accès refusé si non authentifié ou non admin → redirection vers '/'", async () => {
        auth.getCurrentUser.and.returnValue(null);

        setupTestWithRouteId('42');

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(auth.getCurrentUser).toHaveBeenCalled();
    });

    it("ngOnInit → id route invalide → redirection vers '/admin/users'", async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);

        setupTestWithRouteId('NaN');

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
        expect(auth.getUserDetails).not.toHaveBeenCalled();
    });


    it("ngOnInit → charge l'utilisateur (succès) et passe loading=false", async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);

        setupTestWithRouteId(String(TARGET_USER.id));

        await component.ngOnInit();

        expect(auth.getUserDetails).toHaveBeenCalledOnceWith(TARGET_USER.id);
        expect(component.user()).toEqual(TARGET_USER);
        expect(component.loading()).toBeFalse();
    });

    it('ngOnInit → échec de chargement → toast.error + user=null + loading=false', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.rejectWith(new Error('boom'));

        setupTestWithRouteId('42');

        await component.ngOnInit();

        expect(auth.getUserDetails).toHaveBeenCalledOnceWith(42);
        expect(toast.error).toHaveBeenCalledWith('Impossible de charger les détails de cet utilisateur');
        expect(component.user()).toBeNull();
        expect(component.loading()).toBeFalse();
    });

    it("toggleUserRole → confirme, promeut l'utilisateur user→admin, recharge et toast succès", async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        // État courant : TARGET_USER en USER
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        auth.updateUserRole.and.resolveTo(TARGET_USER); // le service renvoie un User, peu importe ici
        confirm.ask.and.resolveTo(true);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit(); // positionne user = TARGET_USER

        await component.toggleUserRole();

        expect(confirm.ask).toHaveBeenCalled();
        expect(auth.updateUserRole).toHaveBeenCalledOnceWith(TARGET_USER.id, UserRole.ADMIN);
        // reload après MAJ
        expect(auth.getUserDetails).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledWith('Alice Martin a été promu administrateur');
    });

    it('toggleUserRole → confirme, rétrograde admin→user, recharge et toast succès', async () => {
        const adminTarget: User = { ...TARGET_USER, role: UserRole.ADMIN };
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(adminTarget);
        auth.updateUserRole.and.resolveTo(adminTarget);
        confirm.ask.and.resolveTo(true);

        setupTestWithRouteId(String(adminTarget.id));
        await component.ngOnInit(); // user = adminTarget

        await component.toggleUserRole();

        expect(auth.updateUserRole).toHaveBeenCalledOnceWith(adminTarget.id, UserRole.USER);
        expect(auth.getUserDetails).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledWith('Alice Martin a été rétrogradé en utilisateur');
    });

    it('toggleUserRole → annule la confirmation → ne fait rien', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        confirm.ask.and.resolveTo(false);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit();

        await component.toggleUserRole();

        expect(confirm.ask).toHaveBeenCalled();
        expect(auth.updateUserRole).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('deleteUser → confirme, supprime, toast succès puis redirection vers la liste', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        auth.deleteUser.and.resolveTo();
        confirm.ask.and.resolveTo(true);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit();

        await component.deleteUser();

        expect(confirm.ask).toHaveBeenCalled();
        expect(auth.deleteUser).toHaveBeenCalledOnceWith(TARGET_USER.id);
        expect(toast.success).toHaveBeenCalledWith('Le compte de Alice Martin a été supprimé');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
    });

    it('deleteUser → annule la confirmation → aucune suppression', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        confirm.ask.and.resolveTo(false);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit();

        await component.deleteUser();

        expect(auth.deleteUser).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('sendResetPasswordEmail → confirme, affiche un toast succès (fonctionnalité à implémenter)', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        confirm.ask.and.resolveTo(true);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit();

        await component.sendResetPasswordEmail();

        expect(confirm.ask).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
            `Email de réinitialisation envoyé à ${TARGET_USER.email}`
        );
    });

    it('suspendAccount → confirme, affiche un toast succès (fonctionnalité à implémenter)', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        auth.getUserDetails.and.resolveTo(TARGET_USER);
        confirm.ask.and.resolveTo(true);

        setupTestWithRouteId(String(TARGET_USER.id));
        await component.ngOnInit();

        await component.suspendAccount();

        expect(confirm.ask).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
            `Le compte de ${TARGET_USER.firstName} ${TARGET_USER.lastName} a été suspendu`
        );
    });

    it("viewOrders → affiche un info toast 'redirection à implémenter'", () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        setupTestWithRouteId(String(TARGET_USER.id));
        component.user.set(TARGET_USER);

        component.viewOrders();

        expect(toast.info).toHaveBeenCalledWith(
            "Redirection vers l'historique des commandes - Fonctionnalité à implémenter"
        );
    });

    it('viewFavorites → affiche un info toast', () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        setupTestWithRouteId(String(TARGET_USER.id));
        component.user.set(TARGET_USER);

        component.viewFavorites();

        expect(toast.info).toHaveBeenCalledWith('Redirection vers les favoris - Fonctionnalité à implémenter');
    });

    it("Helpers → canModifyAdmin retourne false quand l'admin courant tente de se modifier lui-même", async () => {
        // Cas : la page affiche l’utilisateur courant admin (même id)
        const selfAdmin: User = { ...ADMIN };
        auth.getCurrentUser.and.returnValue(selfAdmin);
        auth.getUserDetails.and.resolveTo(selfAdmin);

        setupTestWithRouteId(String(selfAdmin.id));
        await component.ngOnInit();

        expect(component.canModifyAdmin()).toBeFalse();
        expect(component.canDeleteAdmin()).toBeFalse();
    });
});
