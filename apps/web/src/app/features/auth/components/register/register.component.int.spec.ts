import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TAuth = Pick<AuthService, 'register'>;

type UserRoleStr = 'admin' | 'user';
interface RegisterSuccess {
    success: true;
    user: { id: number; role: UserRoleStr };
}
interface RegisterFail {
    success: false;
    error?: string;
}

describe('RegisterComponent — Test d’intégration', () => {
    let router: Router;
    let authSpy: jasmine.SpyObj<TAuth>;
    let toastSpy: jasmine.SpyObj<TToast>;

    function setQueryParams(params: Record<string, string>): void {
        const route = TestBed.inject(ActivatedRoute);
        const snap = route.snapshot as unknown as { queryParamMap: ReturnType<typeof convertToParamMap> };
        snap.queryParamMap = convertToParamMap(params);
    }

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<TAuth>('AuthService', ['register']);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);

        await TestBed.configureTestingModule({
            imports: [RegisterComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authSpy },
                { provide: ToastService, useValue: toastSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigateByUrl').and.resolveTo(true);
    });

    function setValue(host: HTMLElement, selector: string, value: string): void {
        const el = host.querySelector(selector) as HTMLInputElement | null;
        if (!el) throw new Error(`Element not found: ${selector}`);
        el.value = value;
        el.dispatchEvent(new Event('input'));
    }

    function submit(host: HTMLElement): void {
        const form = host.querySelector('form') as HTMLFormElement | null;
        if (!form) throw new Error('Form not found');
        form.dispatchEvent(new Event('submit'));
    }

    it('→ succès : enregistre, toast et redirige vers /catalog', async () => {
        const ok: RegisterSuccess = { success: true, user: { id: 123, role: 'user' } };
        authSpy.register.and.returnValue(
            Promise.resolve(ok) as ReturnType<TAuth['register']>
        );

        const fixture = TestBed.createComponent(RegisterComponent);
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;

        setValue(host, '#firstName', 'Alice');
        setValue(host, '#lastName', 'Durand');
        setValue(host, '#email', 'alice@example.com');
        setValue(host, '#password', 'alice123');
        setValue(host, '#confirmPassword', 'alice123'); // requis et doit matcher

        submit(host);
        await fixture.whenStable();

        expect(authSpy.register).toHaveBeenCalled();
        expect(toastSpy.success).toHaveBeenCalledWith('Compte créé ! Bienvenue 😊');
        expect(router.navigateByUrl).toHaveBeenCalledWith('/catalog');
    });

    it('→ succès avec redirect query param : suit la redirection', async () => {
        const ok: RegisterSuccess = { success: true, user: { id: 123, role: 'user' } };
        authSpy.register.and.returnValue(
            Promise.resolve(ok) as ReturnType<TAuth['register']>
        );

        const fixture = TestBed.createComponent(RegisterComponent);
        setQueryParams({ redirect: '/auth/login' }); // par ex. retour vers la page de connexion
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;

        setValue(host, '#firstName', 'Zoé');
        setValue(host, '#lastName', 'Martin');
        setValue(host, '#email', 'zoe@example.com');
        setValue(host, '#password', 'zoe12345');
        setValue(host, '#confirmPassword', 'zoe12345');

        submit(host);
        await fixture.whenStable();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('→ échec : message d’erreur inline et pas de navigation', async () => {
        const ko: RegisterFail = { success: false, error: 'Cet email est déjà utilisé' };
        authSpy.register.and.resolveTo(ko);

        const fixture = TestBed.createComponent(RegisterComponent);
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;

        setValue(host, '#firstName', 'Bob');
        setValue(host, '#lastName', 'Martin');
        setValue(host, '#email', 'bob@example.com');
        setValue(host, '#password', 'bob1234');
        setValue(host, '#confirmPassword', 'bob1234');

        submit(host);
        await fixture.whenStable();

        const comp = fixture.componentInstance;
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        expect(comp.error()).toBe('Cet email est déjà utilisé');
        expect(toastSpy.success).not.toHaveBeenCalled();
    });

    it('→ formulaire invalide : bloque submit et toast warning', async () => {
        const fixture = TestBed.createComponent(RegisterComponent);
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;

        // email invalide + mdp trop court + confirm non rempli
        setValue(host, '#firstName', '');
        setValue(host, '#lastName', '');
        setValue(host, '#email', 'bad');
        setValue(host, '#password', '123');
        // confirmPassword manquant → invalide

        submit(host);
        await fixture.whenStable();

        expect(authSpy.register).not.toHaveBeenCalled();
        expect(toastSpy.warning).toHaveBeenCalledWith('Complétez les champs requis.');
    });
});
