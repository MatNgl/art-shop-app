import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  const authMock = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
  (authMock.register as jasmine.Spy).and.callFake(async (payload: { email: string }) => ({
    success: true,
    user: { id: 123, email: payload.email },
  }));

  const toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'warning', 'error']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        RouterTestingModule, // fournit RouterLink + ActivatedRoute
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
        // ⚠️ pas de Router mock ici
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show warning when submitting invalid form', async () => {
    component.registerForm.reset();
    await component.onSubmit();
    expect(toastMock.warning).toHaveBeenCalled();
  });

  it('should call auth.register and navigate on success', async () => {
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
