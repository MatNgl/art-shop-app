import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../../services/auth';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User, UserRole } from '../../models/user.model'; // ← adapte le chemin si besoin

describe('Modification du mot de passe (ChangePasswordComponent)', () => {
    let fixture: ComponentFixture<ChangePasswordComponent>;
    let component: ChangePasswordComponent;

    let authSpy: jasmine.SpyObj<Pick<AuthService, 'changePassword' | 'getCurrentUser'>>;
    let toastSpy: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;

    // Petit helper pour construire un User valide
    const makeUser = (overrides: Partial<User> = {}): User => ({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER, // ou la valeur correspondant à ton modèle
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<Pick<AuthService, 'changePassword' | 'getCurrentUser'>>(
            'AuthService',
            ['changePassword', 'getCurrentUser']
        );

        // On renvoie un User conforme, avec un champ "password" optionnel (utile pour préremplir le champ)
        const userWithPwd: User & { password?: string } = {
            ...makeUser(),
            password: 'oldPass123',
        };
        authSpy.getCurrentUser.and.returnValue(userWithPwd);

        toastSpy = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error'>>(
            'ToastService',
            ['success', 'error']
        );

        await TestBed.configureTestingModule({
            imports: [ChangePasswordComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authSpy },
                { provide: ToastService, useValue: toastSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChangePasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('ne fait rien si le formulaire est invalide', async () => {
        component.form.setValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await component.save();
        expect(authSpy.changePassword).not.toHaveBeenCalled();
    });

    it('appelle changePassword et affiche un succès', async () => {
        (authSpy.changePassword as jasmine.Spy).and.returnValue(Promise.resolve());

        component.form.setValue({
            currentPassword: 'oldPass123',
            newPassword: 'Newpass1',
            confirmPassword: 'Newpass1',
        });

        await component.save();

        expect(authSpy.changePassword).toHaveBeenCalled();
        expect(toastSpy.success).toHaveBeenCalled();
        expect(component.saved()).toBeTrue();
    });

    it('affiche une erreur si changePassword rejette', async () => {
        (authSpy.changePassword as jasmine.Spy).and.returnValue(Promise.reject(new Error('fail')));

        component.form.setValue({
            currentPassword: 'oldPass123',
            newPassword: 'Newpass1',
            confirmPassword: 'Newpass1',
        });

        await component.save();

        expect(toastSpy.error).toHaveBeenCalled();
        expect(component.saved()).toBeFalse();
    });
});
