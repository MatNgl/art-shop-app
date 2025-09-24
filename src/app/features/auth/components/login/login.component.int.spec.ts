// login.component.int.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

type UserRoleStr = 'admin' | 'user';

interface LoginSuccess {
    success: true;
    user: { id: number; role: UserRoleStr };
}
interface LoginFail {
    success: false;
    error?: string;
}

type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TAuth = Pick<AuthService, 'login'>;

describe('LoginComponent — Test d’intégration', () => {
    let router: Router;
    let authSpy: jasmine.SpyObj<TAuth>;
    let toastSpy: jasmine.SpyObj<TToast>;

    function setQueryParams(params: Record<string, string>): void {
        const route = TestBed.inject(ActivatedRoute);
        // On met à jour UNIQUEMENT la propriété queryParamMap du snapshot pour éviter
        // de recréer un ActivatedRouteSnapshot complet (très typé).
        const snap = route.snapshot as unknown as {
            queryParamMap: ReturnType<typeof convertToParamMap>;
        };
        snap.queryParamMap = convertToParamMap(params);
    }

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<TAuth>('AuthService', ['login']);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);

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

    function fillAndSubmit(host: HTMLElement, email: string, password: string): void {
        const emailInput = host.querySelector('#email') as HTMLInputElement | null;
        const pwdInput = host.querySelector('#password') as HTMLInputElement | null;
        const form = host.querySelector('form') as HTMLFormElement | null;

        if (!emailInput || !pwdInput || !form) {
            throw new Error('Form elements not found');
        }

        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input'));
        pwdInput.value = password;
        pwdInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit'));
    }

    it('succès user: redirige vers /catalog et affiche un toast', async () => {
        const ok: LoginSuccess = { success: true, user: { id: 1, role: 'user' } };
        authSpy.login.and.returnValue(
            Promise.resolve(ok) as ReturnType<TAuth['login']>
        );

        const fixture = TestBed.createComponent(LoginComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        fillAndSubmit(host, 'user@example.com', 'user123');

        await fixture.whenStable();

        expect(authSpy.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'user123' });
        expect(toastSpy.success).toHaveBeenCalledWith('Bienvenue !');
        expect(router.navigateByUrl).toHaveBeenCalledWith('/catalog');
        expect(comp.loading()).toBeFalse();
        expect(comp.error()).toBeNull();
    });

    it('succès admin: redirige vers /admin', async () => {
        const ok: LoginSuccess = { success: true, user: { id: 9, role: 'admin' } };
        authSpy.login.and.returnValue(
            Promise.resolve(ok) as ReturnType<TAuth['login']>
        );

        const fixture = TestBed.createComponent(LoginComponent);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        fillAndSubmit(host, 'admin@example.com', 'admin123');

        await fixture.whenStable();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
    });

    it('succès avec redirect query param: suit la redirection', async () => {
        const ok: LoginSuccess = { success: true, user: { id: 2, role: 'user' } };
        authSpy.login.and.returnValue(
            Promise.resolve(ok) as ReturnType<TAuth['login']>
        );

        const fixture = TestBed.createComponent(LoginComponent);
        setQueryParams({ redirect: '/cart' });
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        fillAndSubmit(host, 'user@example.com', 'user123');

        await fixture.whenStable();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/cart');
    });

    it('échec (identifiants invalides): affiche une erreur et ne navigue pas', async () => {
        const ko: LoginFail = { success: false, error: 'Identifiants invalides' };
        authSpy.login.and.resolveTo(ko);

        const fixture = TestBed.createComponent(LoginComponent);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        // Mot de passe >= 6 chars pour passer la validation du formulaire
        fillAndSubmit(host, 'bad@ex.fr', 'wrong12');

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
        fillAndSubmit(host, 'user@ex.fr', 'user123');

        await fixture.whenStable();

        const comp = fixture.componentInstance;
        expect(comp.loading()).toBeFalse();
        expect(comp.error()).toBe('Oups');
    });

    it('formulaire invalide: bloque le submit et affiche warning', async () => {
        const fixture = TestBed.createComponent(LoginComponent);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        fillAndSubmit(host, '', '123'); // email vide, mdp trop court

        await fixture.whenStable();

        expect(authSpy.login).not.toHaveBeenCalled();
        expect(toastSpy.warning).toHaveBeenCalledWith('Complétez les champs requis.');
    });

    it('bouton “Afficher/Masquer” bascule le type du mot de passe', async () => {
        const fixture = TestBed.createComponent(LoginComponent);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const pwd = host.querySelector('#password') as HTMLInputElement | null;
        const toggle = host.querySelector('button[type="button"]') as HTMLButtonElement | null;

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

    it('menu mobile: toggle affiche/masque le menu', async () => {
        const fixture = TestBed.createComponent(LoginComponent);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const btn = host.querySelector('.sm\\:hidden button') as HTMLButtonElement | null;
        if (!btn) throw new Error('Mobile menu button not found');

        // fermé par défaut
        expect(host.querySelector('.sm\\:hidden .absolute')).toBeNull();

        btn.click();
        fixture.detectChanges();
        expect(host.querySelector('.sm\\:hidden .absolute')).not.toBeNull();

        btn.click();
        fixture.detectChanges();
        expect(host.querySelector('.sm\\:hidden .absolute')).toBeNull();
    });
});
