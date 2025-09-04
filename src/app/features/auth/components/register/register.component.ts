import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Fond image : double couche (cover flouté + contain net) -->
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

    <!-- Wrapper ANCRÉ sous le header -->
    <div class="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden">
      <div
        class="w-full mx-auto max-w-6xl h-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4"
      >
        <!-- Panneau vitrine -->
        <section class="hidden lg:block">
          <div class="relative">
            <div class="absolute -inset-4 rounded-[2rem] bg-black/30 blur-2xl"></div>
            <div
              class="relative backdrop-blur-md bg-white/10 border border-white/25 rounded-3xl p-10 shadow-2xl"
            >
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                  <span class="text-2xl">🖌️</span>
                </div>
                <h2 class="text-3xl font-bold text-white drop-shadow">Rejoindre Art Shop</h2>
              </div>
              <p class="text-white/90">
                Créez votre compte pour ajouter au panier, sauvegarder vos favoris et passer
                commande.
              </p>
            </div>
          </div>
        </section>

        <!-- Carte register -->
        <section class="relative w-full">
          <div class="absolute -inset-4 rounded-[2rem] bg-black/35 md:bg-black/30 blur-2xl"></div>

          <div
            class="relative backdrop-blur-3xl bg-white/15 border border-white/40
                  shadow-[0_20px_80px_rgba(0,0,0,.35)] ring-1 ring-white/20
                  rounded-3xl p-8 sm:p-10"
          >
            <div class="mb-8 text-center">
              <h1 class="text-2xl font-bold text-white drop-shadow">Créer un compte</h1>
              <p class="text-sm text-white/80 mt-2">
                Déjà inscrit ?
                <a
                  routerLink="/auth/login"
                  class="text-blue-200 hover:text-white font-medium underline"
                  >Se connecter</a
                >
              </p>
            </div>

            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-white/90"
                    >Prénom</label
                  >
                  <input
                    id="firstName"
                    type="text"
                    formControlName="firstName"
                    class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70
                            px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                    [class.border-red-400]="isInvalid('firstName')"
                    placeholder="Alex"
                  />
                  @if (isInvalid('firstName')) {
                  <p class="mt-1 text-sm text-red-200">Ce champ est requis</p>
                  }
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-white/90">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    formControlName="lastName"
                    class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70
                            px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                    [class.border-red-400]="isInvalid('lastName')"
                    placeholder="Martin"
                  />
                  @if (isInvalid('lastName')) {
                  <p class="mt-1 text-sm text-red-200">Ce champ est requis</p>
                  }
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-white/90"
                  >Adresse email</label
                >
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70
                          px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                  [class.border-red-400]="isInvalid('email')"
                  placeholder="vous@exemple.com"
                />
                @if (isInvalid('email')) {
                <p class="mt-1 text-sm text-red-200">
                  {{
                    registerForm.get('email')?.hasError('required')
                      ? 'Ce champ est requis'
                      : 'Format d’email invalide'
                  }}
                </p>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="password" class="block text-sm font-medium text-white/90"
                    >Mot de passe</label
                  >
                  <div class="relative mt-1">
                    <input
                      id="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      formControlName="password"
                      autocomplete="new-password"
                      class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70
                              px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                      [class.border-red-400]="isInvalid('password')"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg
                               text-white/90 hover:bg-white/15"
                      (click)="toggleShowPassword()"
                    >
                      {{ showPassword() ? 'Masquer' : 'Afficher' }}
                    </button>
                  </div>
                  @if (isInvalid('password')) {
                  <p class="mt-1 text-sm text-red-200">Minimum 6 caractères</p>
                  }
                </div>

                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-white/90"
                    >Confirmer le mot de passe</label
                  >
                  <div class="relative mt-1">
                    <input
                      id="confirmPassword"
                      [type]="showConfirm() ? 'text' : 'password'"
                      formControlName="confirmPassword"
                      autocomplete="new-password"
                      class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70
                              px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                      [class.border-red-400]="confirmInvalid()"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg
                               text-white/90 hover:bg-white/15"
                      (click)="toggleShowConfirm()"
                    >
                      {{ showConfirm() ? 'Masquer' : 'Afficher' }}
                    </button>
                  </div>
                  @if (confirmInvalid()) {
                  <p class="mt-1 text-sm text-red-200">Les mots de passe ne correspondent pas</p>
                  }
                </div>
              </div>

              <button
                type="submit"
                [disabled]="registerForm.invalid || loading()"
                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/90 text-white
                         px-4 py-2 font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy="{{ loading() }}"
              >
                @if (loading()) {
                <span
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></span>
                Création du compte... } @else { S'inscrire }
              </button>

              @if (error()) {
              <div
                class="rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-50"
              >
                {{ error() }}
              </div>
              }
            </form>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // même fond que le login (change le nom si besoin)
  bgUrl = 'assets/hero/login-bg.jpg';

  loading = signal(false);
  error = signal<string | null>(null);

  showPassword = signal(false);
  showConfirm = signal(false);

  registerForm = this.fb.group(
    {
      firstName: this.fb.nonNullable.control('', [Validators.required]),
      lastName: this.fb.nonNullable.control('', [Validators.required]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
    },
    { validators: [passwordsMatch] }
  );

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }
  toggleShowConfirm() {
    this.showConfirm.update((v) => !v);
  }

  isInvalid(ctrl: 'firstName' | 'lastName' | 'email' | 'password'): boolean {
    const c = this.registerForm.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  confirmInvalid(): boolean {
    const c = this.registerForm.get('confirmPassword');
    const groupMismatch = this.registerForm.hasError('passwordsMismatch');
    return !!(
      (c && c.invalid && (c.dirty || c.touched)) ||
      (groupMismatch && (this.registerForm.dirty || this.registerForm.touched))
    );
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { firstName, lastName, email, password, confirmPassword } =
      this.registerForm.getRawValue();

    try {
      const res = await this.auth.register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      });
      this.loading.set(false);

      if (res.success && res.user) {
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/catalog';
        this.router.navigate([redirect]);
      } else {
        this.error.set(res.error ?? 'Erreur lors de la création du compte');
      }
    } catch (e) {
      this.loading.set(false);
      this.error.set(e instanceof Error ? e.message : 'Erreur lors de la création du compte');
    }
  }
}
