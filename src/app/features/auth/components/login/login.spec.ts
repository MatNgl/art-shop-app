import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

describe('Composant de connexion (LoginComponent)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  let authSpy: jasmine.SpyObj<Pick<AuthService, 'login'>>;
  let toastSpy: jasmine.SpyObj<Pick<ToastService, 'success' | 'warning' | 'error'>>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Pick<AuthService, 'login'>>('AuthService', ['login']);
    toastSpy = jasmine.createSpyObj<Pick<ToastService, 'success' | 'warning' | 'error'>>(
      'ToastService',
      ['success', 'warning', 'error']
    );

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crée correctement', () => {
    expect(component).toBeTruthy();
  });

  it('soumission invalide → affiche un avertissement et ne tente pas de se connecter', async () => {
    component.loginForm.setValue({ email: '', password: '', remember: true });
    await component.onSubmit();
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('connexion réussie → navigue et affiche un succès', async () => {
    const user = { id: 1, email: 'user@example.com', role: 'user' };
    authSpy.login.and.returnValue(
      Promise.resolve({ success: true, user }) as unknown as ReturnType<AuthService['login']>
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'pass123',
      remember: true,
    });

    await component.onSubmit();

    expect(toastSpy.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('erreur de connexion (exception) → message d’erreur affiché', async () => {
    authSpy.login.and.rejectWith(new Error('boom'));

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'pass123',
      remember: true,
    });

    await component.onSubmit();

    expect(component.error()).toBe('boom');
  });
});
