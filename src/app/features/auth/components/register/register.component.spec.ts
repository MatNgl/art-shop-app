// src/app/features/auth/pages/register/register.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

type RegisterPayload = Parameters<AuthService['register']>[0];

describe('Composant d’inscription (RegisterComponent)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let router: Router;

  const authMock = jasmine.createSpyObj<Pick<AuthService, 'register'>>('AuthService', ['register']);
  const toastMock = jasmine.createSpyObj<Pick<ToastService, 'success' | 'warning' | 'error'>>(
    'ToastService',
    ['success', 'warning', 'error']
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crée correctement', () => {
    expect(component).toBeTruthy();
  });

  it('soumission invalide → affiche un avertissement et ne tente pas de créer un compte', async () => {
    (authMock.register as jasmine.Spy).calls.reset();
    toastMock.warning.calls.reset();

    // invalide : requis manquants + email invalide + mdp trop court + mismatch
    component.registerForm.setValue({
      firstName: '',
      lastName: '',
      email: 'bad',
      password: 'abc',
      confirmPassword: 'xyz',
    });
    expect(component.registerForm.invalid).toBeTrue();

    await component.onSubmit();

    expect(toastMock.warning).toHaveBeenCalledWith('Complétez les champs requis.');
    expect(authMock.register).not.toHaveBeenCalled();
  });

  it('inscription réussie → appelle register, affiche un succès et navigue', async () => {
    (authMock.register as jasmine.Spy).calls.reset();
    toastMock.success.calls.reset();
    (router.navigateByUrl as jasmine.Spy).calls.reset();

    // Stub explicite pour CE test (random-safe)
    (authMock.register as jasmine.Spy).and.callFake(async (payload: RegisterPayload) => ({
      success: true,
      user: { id: 123, email: payload.email },
    }));

    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(component.registerForm.valid).toBeTrue();

    await component.onSubmit();

    expect(authMock.register).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith('Compte créé ! Bienvenue 😊');
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('email déjà utilisé → error inline et pas de toast success', async () => {
    (authMock.register as jasmine.Spy).calls.reset();
    toastMock.success.calls.reset();

    // Stub explicite : échec "email utilisé"
    (authMock.register as jasmine.Spy).and.resolveTo({
      success: false,
      error: 'Cet email est déjà utilisé',
    });

    component.registerForm.patchValue({
      firstName: 'Dup',
      lastName: 'Li',
      email: 'dup@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(component.registerForm.valid).toBeTrue();

    await component.onSubmit();

    expect(component.error()).toBe('Cet email est déjà utilisé');
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
