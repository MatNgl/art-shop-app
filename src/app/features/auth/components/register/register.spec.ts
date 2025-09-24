// src/app/features/auth/pages/register/register.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

describe('Composant d’inscription (RegisterComponent)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let router: Router;

  const authMock = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
  (authMock.register as jasmine.Spy).and.callFake(async (payload: { email: string }) => ({
    success: true,
    user: { id: 123, email: payload.email },
  }));

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
    component.registerForm.reset();
    await component.onSubmit();
    expect(toastMock.warning).toHaveBeenCalled();
    expect(authMock.register).not.toHaveBeenCalled();
  });

  it('inscription réussie → appelle register, affiche un succès et navigue', async () => {
    component.registerForm.patchValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });

    await component.onSubmit();

    expect(authMock.register).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });
});



