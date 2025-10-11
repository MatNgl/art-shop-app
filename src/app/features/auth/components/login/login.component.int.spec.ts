// src/app/features/auth/components/login/login.component.int.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

type UserRoleStr = 'admin' | 'user';

// ← Derive the exact response type returned by AuthService.login()
type LoginResponse = Awaited<ReturnType<AuthService['login']>>;

type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TAuth = Pick<AuthService, 'login'>;

describe('LoginComponent — Test d’intégration', () => {
  let router: Router;
  let authSpy: jasmine.SpyObj<TAuth>;
  let toastSpy: jasmine.SpyObj<TToast>;

  function setQueryParams(params: Record<string, string>): void {
    const route = TestBed.inject(ActivatedRoute);
    const snap = route.snapshot as unknown as {
      queryParamMap: ReturnType<typeof convertToParamMap>;
    };
    snap.queryParamMap = convertToParamMap(params);
  }

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<TAuth>('AuthService', ['login']);
    toastSpy = jasmine.createSpyObj<TToast>('ToastService', [
      'success',
      'error',
      'info',
      'warning',
    ]);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } as ActivatedRoute,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  /** Construit un LoginResponse de succès avec un user complet conforme au modèle */
  function makeOk(id: number, role: UserRoleStr): LoginResponse {
    const now = new Date().toISOString();
    return {
      success: true,
      user: {
        id,
        role,
        email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
        firstName: role === 'admin' ? 'Admin' : 'User',
        lastName: 'Test',
        createdAt: now,
        updatedAt: now,
        // Si votre User a d'autres champs optionnels, vous pouvez les ajouter ici.
      } as unknown as LoginResponse extends { user: infer U } ? U : never,
    };
  }

  it('succès user: redirige vers /catalog et affiche un toast', async () => {
    const ok: LoginResponse = makeOk(1, 'user');
    authSpy.login.and.resolveTo(ok);

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = 'user@example.com';
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = 'user123';
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    expect(authSpy.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'user123' });
    expect(toastSpy.success).toHaveBeenCalledWith('Bienvenue !');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/catalog');
    expect(comp.loading()).toBeFalse();
    expect(comp.error()).toBeNull();
  });

  it('succès admin: redirige vers /admin', async () => {
    const ok: LoginResponse = makeOk(9, 'admin');
    authSpy.login.and.resolveTo(ok);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = 'admin@example.com';
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = 'admin123';
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('succès avec redirect query param: suit la redirection', async () => {
    setQueryParams({ redirect: '/cart' });

    const ok: LoginResponse = makeOk(2, 'user');
    authSpy.login.and.resolveTo(ok);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = 'user@example.com';
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = 'user123';
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cart');
  });

  it('échec (identifiants invalides): affiche une erreur et ne navigue pas', async () => {
    const ko: LoginResponse = { success: false, error: 'Identifiants invalides' };
    authSpy.login.and.resolveTo(ko);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = 'bad@ex.fr';
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = 'wrong12'; // >= 6 chars
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    const comp = fixture.componentInstance;
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(comp.error()).toBe('Identifiants invalides');
  });

  it('exception non-HTTP: place un message dans error()', async () => {
    authSpy.login.and.rejectWith(new Error('Oups'));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = 'user@ex.fr';
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = 'user123';
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    const comp = fixture.componentInstance;
    expect(comp.loading()).toBeFalse();
    expect(comp.error()).toBe('Oups');
  });

  it('formulaire invalide: bloque le submit et affiche warning', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const pwdInput = host.querySelector('#password') as HTMLInputElement;
    const form = host.querySelector('form') as HTMLFormElement;

    emailInput.value = ''; // email vide
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = '123'; // mdp trop court
    pwdInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(toastSpy.warning).toHaveBeenCalledWith('Complétez les champs requis.');
  });

  it('bouton “Afficher/Masquer” bascule le type du mot de passe', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const pwd = host.querySelector('#password') as HTMLInputElement | null;
    const toggle = host.querySelector(
      '[data-testid="toggle-password"]'
    ) as HTMLButtonElement | null;

    if (!pwd || !toggle) {
      throw new Error('Password input or toggle button not found');
    }

    expect(pwd.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(pwd.type).toBe('text');
    toggle.click();
    fixture.detectChanges();
    expect(pwd.type).toBe('password');
  });
  it('n’affiche pas de menu mobile', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const btn = host.querySelector('[data-testid="mobile-menu-btn"]');
    const menu = host.querySelector('[data-testid="mobile-menu"]');

    expect(btn).toBeNull();
    expect(menu).toBeNull();
  });
});
