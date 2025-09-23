import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: Partial<AuthService>;
  let toastSpy: Partial<ToastService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'warning', 'error']) as Partial<ToastService>;

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        RouterTestingModule, // fournit ActivatedRoute + RouterLink
      ],
      providers: [
        provideRouter([]),   // route table vide OK
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        // ⚠️ NE FOURNIS PAS Router en useValue → on utilisera le vrai et on spy dessus
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows warning when form is invalid on submit', async () => {
    component.loginForm.setValue({ email: '', password: '', remember: true });
    await component.onSubmit();
    expect((toastSpy.warning as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });

  it('navigates on successful login and shows success toast', async () => {
    const user = { id: 1, email: 'user@example.com', role: 'user' };
    (authSpy.login as jasmine.Spy).and.returnValue(Promise.resolve({ success: true, user }));

    component.loginForm.setValue({ email: 'user@example.com', password: 'pass123', remember: true });
    await component.onSubmit();

    expect((toastSpy.success as jasmine.Spy).calls.count()).toBeGreaterThan(0);
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('sets error message on auth error (non HttpErrorResponse)', async () => {
    (authSpy.login as jasmine.Spy).and.throwError(new Error('boom'));

    component.loginForm.setValue({ email: 'user@example.com', password: 'pass123', remember: true });
    await component.onSubmit();

    expect(component.error()).toBe('boom');
  });
});
