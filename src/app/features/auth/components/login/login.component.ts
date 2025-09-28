import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./login.component.scss'],
  template: `
    <!-- Fond image (cover + contain) -->
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        [src]="bgUrl"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full object-cover blur-sm opacity-60"
      />
      <img
        [src]="bgUrl"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full object-contain"
      />
    </div>

    <!-- Contenu -->
    <div class="auth-shell mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
      <!-- Bouton menu mobile + menu -->
      <button
        type="button"
        class="md:hidden mb-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-white hover:bg-white/30"
        data-testid="mobile-menu-btn"
        aria-controls="mobile-menu"
        [attr.aria-expanded]="mobileMenuOpen()"
        (click)="toggleMobileMenu()"
      >
        <i class="fa-solid fa-bars"></i>
        Menu
      </button>

      <nav
        id="mobile-menu"
        data-testid="mobile-menu"
        class="md:hidden mb-6 rounded-xl border border-white/30 bg-white/15 p-4 text-white"
        [class.hidden]="!mobileMenuOpen()"
      >
        <a routerLink="/catalog" class="block py-2 hover:underline">Catalogue</a>
        <a routerLink="/auth/register" class="block py-2 hover:underline">Créer un compte</a>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <!-- Vitrine -->
        <section class="hidden lg:block">
          <div class="relative">
            <div class="absolute -inset-4 rounded-[2rem] bg-black/30 blur-2xl"></div>
            <div
              class="relative backdrop-blur-md bg-white/10 border border-white/25 rounded-3xl p-10 shadow-2xl"
            >
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                  <span class="text-2xl">🎨</span>
                </div>
                <h2 class="text-3xl font-bold text-white drop-shadow">Art Shop</h2>
              </div>
              <p class="text-white/90 mb-6">
                Explorez le catalogue, ajoutez vos favoris et suivez vos commandes. Connectez-vous
                pour une expérience complète.
              </p>

              <div class="space-y-3 mb-8">
                <div class="flex items-center gap-3 text-white/80 text-sm">
                  <i class="fa-solid fa-heart text-pink-400"></i>
                  <span>Sauvegardez vos œuvres préférées</span>
                </div>
                <div class="flex items-center gap-3 text-white/80 text-sm">
                  <i class="fa-solid fa-cart-shopping text-blue-400"></i>
                  <span>Panier personnalisé et commandes</span>
                </div>
                <div class="flex items-center gap-3 text-white/80 text-sm">
                  <i class="fa-solid fa-user text-green-400"></i>
                  <span>Profil et historique personnalisés</span>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <a
                  routerLink="/catalog"
                  class="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm border border-white/30"
                >
                  <i class="fa-solid fa-eye"></i>
                  Parcourir sans compte
                </a>
                <p class="text-xs text-white/60 text-center">
                  Vous pouvez explorer librement, la connexion n'est pas obligatoire
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Carte login -->
        <section class="relative w-full">
          <div class="absolute -inset-4 rounded-[2rem] bg-black/35 md:bg-black/30 blur-2xl"></div>

          <div
            class="relative backdrop-blur-3xl bg-white/15 border border-white/40 shadow-[0_20px_80px_rgba(0,0,0,.35)] ring-1 ring-white/20 rounded-3xl p-8 sm:p-10"
          >
            <div class="mb-8 text-center">
              <h1 class="text-2xl font-bold text-white drop-shadow">Connexion</h1>
              <p class="text-sm text-white/80 mt-2">
                Pas de compte ?
                <a
                  routerLink="/auth/register"
                  class="text-blue-200 hover:text-white font-medium underline"
                >
                  Créer un compte
                </a>
              </p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-white/90"
                  >Adresse email</label
                >
                <div class="mt-1 relative">
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                    [class.border-red-400]="isFieldInvalid('email')"
                    placeholder="vous@exemple.com"
                  />
                  <svg
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 12l-4 4-4-4m8-4H8"
                    />
                  </svg>
                </div>
                @if (isFieldInvalid('email')) {
                <p class="mt-1 text-sm text-red-200">{{ getFieldError('email') }}</p>
                }
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-white/90"
                  >Mot de passe</label
                >
                <div class="mt-1 relative">
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
                    class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pl-10 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                    [class.border-red-400]="isFieldInvalid('password')"
                    placeholder="••••••••"
                  />
                  <svg
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 11c-1.105 0-2 .895-2 2v3h4v-3c0-1.105-.895-2-2-2z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V8a4 4 0 118 0v3M6 11h12v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7z"
                    />
                  </svg>
                  <button
                    type="button"
                    data-testid="toggle-password"
                    class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg text-white/90 hover:bg-white/15"
                    (click)="toggleShowPassword()"
                  >
                    {{ showPassword() ? 'Masquer' : 'Afficher' }}
                  </button>
                </div>
                @if (isFieldInvalid('password')) {
                <p class="mt-1 text-sm text-red-200">{{ getFieldError('password') }}</p>
                }
              </div>

              <!-- Remember + forgot -->
              <div class="flex items-center justify-between">
                <label class="inline-flex items-center gap-2 text-sm text-white/90 select-none">
                  <input
                    type="checkbox"
                    formControlName="remember"
                    class="h-4 w-4 rounded border-white/50 bg-white/30 text-blue-300 focus:ring-blue-300"
                  />
                  Se souvenir de moi
                </label>
                <a
                  routerLink="/auth/forgot-password"
                  [queryParams]="{ email: loginForm.get('email')?.value || null }"
                  class="text-sm text-blue-200 hover:text-white underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="loginForm.invalid || loading()"
                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/90 text-white px-4 py-2 font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy="{{ loading() }}"
              >
                @if (loading()) {
                <span
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></span>
                Connexion en cours... } @else { Se connecter }
              </button>

              @if (error()) {
              <div
                class="rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-50"
              >
                {{ error() }}
              </div>
              }
            </form>

            <!-- Comptes de test -->
            <div class="mt-6 text-xs text-white/80">
              <p><span class="font-semibold">Admin</span> : admin@example.com / admin123</p>
              <p><span class="font-semibold">User</span> : user@example.com / user123</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  bgUrl = 'assets/hero/login-bg.jpg';

  showPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    remember: this.fb.nonNullable.control(true),
  });

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  mobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  isFieldInvalid(fieldName: 'email' | 'password'): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: 'email' | 'password'): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Format du mail invalide';
      if (field.errors['minlength'])
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.toast.warning('Complétez les champs requis.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      const res = await this.authService.login({ email, password });
      this.loading.set(false);

      if (res.success && res.user) {
        this.toast.success('Bienvenue !');
        const qp = this.route.snapshot.queryParamMap;
        const redirect = qp.get('redirect') || qp.get('returnUrl');
        const fallback = res.user.role === 'admin' ? '/admin' : '/catalog';
        await this.router.navigateByUrl(redirect || fallback);
      } else {
        this.error.set(res.error ?? 'Email ou mot de passe incorrect');
      }
    } catch (e) {
      this.loading.set(false);
      if (!(e instanceof HttpErrorResponse)) {
        const msg = e instanceof Error ? e.message : 'Erreur de connexion';
        this.error.set(msg);
      }
    }
  }
}
