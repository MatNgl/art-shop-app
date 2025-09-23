import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../../services/auth';
import { ToastService } from 'src/app/shared/services/toast.service';

describe('ChangePasswordComponent', () => {
    let fixture: ComponentFixture<ChangePasswordComponent>;
    let component: ChangePasswordComponent;
    let authSpy: Partial<AuthService>;
    let toastSpy: Partial<ToastService>;

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['changePassword', 'getCurrentUser']);
        (authSpy.getCurrentUser as jasmine.Spy).and.returnValue({ id: 1, password: 'oldPass123' });

        toastSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [
                ChangePasswordComponent,
                RouterTestingModule, // ← fournit ActivatedRoute et RouterLink
            ],
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('does nothing when form is invalid on save', async () => {
        component.form.setValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await component.save();
        expect((authSpy.changePassword as jasmine.Spy).calls.count()).toBe(0);
    });

    it('calls auth.changePassword and shows success on success', async () => {
        (authSpy.changePassword as jasmine.Spy).and.returnValue(Promise.resolve(true));

        component.form.setValue({ currentPassword: 'oldPass123', newPassword: 'Newpass1', confirmPassword: 'Newpass1' });
        await component.save();

        expect((authSpy.changePassword as jasmine.Spy).calls.count()).toBeGreaterThan(0);
        expect((toastSpy.success as jasmine.Spy).calls.count()).toBeGreaterThan(0);
        expect(component.saved()).toBeTrue();
    });

    it('shows error toast when changePassword throws', async () => {
        (authSpy.changePassword as jasmine.Spy).and.throwError(new Error('fail'));

        component.form.setValue({ currentPassword: 'oldPass123', newPassword: 'Newpass1', confirmPassword: 'Newpass1' });
        await component.save();

        expect((toastSpy.error as jasmine.Spy).calls.count()).toBeGreaterThan(0);
        expect(component.saved()).toBeFalse();
    });
});
