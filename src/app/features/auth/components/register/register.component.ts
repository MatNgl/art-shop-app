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

    <!-- Mini-header fixe avec navigation -->
    <div
      class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-16">
          <!-- Logo + retour au site -->
          <div class="flex items-center gap-4">
            <a routerLink="/" class="flex items-center gap-3 group">
              <div
                class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
              >
                <span class="text-white font-bold text-sm">AS</span>
              </div>
              <span
                class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors"
              >
                Art Shop
              </span>
            </a>

            <!-- Séparateur visuel -->
            <div class="hidden sm:block w-px h-6 bg-gray-300"></div>

            <!-- Navigation rapide -->
            <div class="hidden sm:flex items-center gap-1">
              <a
                routerLink="/catalog"
                class="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Catalogue
              </a>
              <a
                routerLink="/"
                class="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Accueil
              </a>
            </div>
          </div>

          <!-- Actions droite -->
          <div class="flex items-center gap-3">
            <!-- Menu burger mobile pour navigation -->
            <div class="sm:hidden relative">
              <button
                (click)="toggleMobileMenu()"
                class="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Menu de navigation"
              >
                <i class="fa-solid fa-bars"></i>
              </button>

              @if (showMobileMenu()) {
              <div
                class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50"
              >
                <div class="py-2">
                  <a routerLink="/" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    🏠 Accueil
                  </a>
                  <a
                    routerLink="/catalog"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🎨 Catalogue
                  </a>
                  <div class="border-t my-1"></div>
                  <a
                    routerLink="/auth/login"
                    class="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    Se connecter
                  </a>
                </div>
              </div>
              }
            </div>

            <!-- Bouton de connexion (desktop) -->
            <a
              routerLink="/auth/login"
              class="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Se connecter
            </a>

            <!-- Indicateur de page actuelle -->
            <div class="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
              <i class="fa-solid fa-user-plus"></i>
              <span class="text-sm font-medium">Inscription</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Wrapper ANCRÉ sous le mini-header -->
    <div class="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden">
      <div
        class="w-full mx-auto max-w-6xl h-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4"
      >
        <!-- Panneau vitrine avec avantages de l'inscription -->
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
              <p class="text-white/90 mb-6">
                Créez votre compte pour ajouter au panier, sauvegarder vos favoris et passer
                commande.
              </p>

              <!-- Avantages de l'inscription -->
              <div class="space-y-4 mb-8">
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mt-0.5"
                  >
                    <i class="fa-solid fa-check text-green-400"></i>
                  </div>
                  <div>
                    <div class="text-white font-medium text-sm">Panier personnalisé</div>
                    <div class="text-white/70 text-xs">
                      Sauvegardez vos sélections entre les visites
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center mt-0.5"
                  >
                    <i class="fa-solid fa-heart text-pink-400"></i>
                  </div>
                  <div>
                    <div class="text-white font-medium text-sm">Liste de favoris</div>
                    <div class="text-white/70 text-xs">
                      Gardez vos coups de cœur à portée de main
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mt-0.5"
                  >
                    <i class="fa-solid fa-truck text-blue-400"></i>
                  </div>
                  <div>
                    <div class="text-white font-medium text-sm">Suivi des commandes</div>
                    <div class="text-white/70 text-xs">Historique et statut de livraison</div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mt-0.5"
                  >
                    <i class="fa-solid fa-bell text-purple-400"></i>
                  </div>
                  <div>
                    <div class="text-white font-medium text-sm">Alertes personnalisées</div>
                    <div class="text-white/70 text-xs">Nouveautés de vos artistes préférés</div>
                  </div>
                </div>
              </div>

              <!-- CTA pour continuer sans compte -->
              <div class="flex flex-col gap-3">
                <a
                  routerLink="/catalog"
                  class="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm border border-white/30"
                >
                  <i class="fa-solid fa-eye"></i>
                  Explorer d'abord
                </a>
                <p class="text-xs text-white/60 text-center">
                  Vous pouvez toujours créer un compte plus tard
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Carte d'inscription améliorée -->
        <section class="relative w-full">
          <div class="absolute -inset-4 rounded-[2rem] bg-black/35 md:bg-black/30 blur-2xl"></div>

          <div
            class="relative backdrop-blur-3xl bg-white/15 border border-white/40 shadow-[0_20px_80px_rgba(0,0,0,.35)] ring-1 ring-white/20 rounded-3xl p-8 sm:p-10"
          >
            <!-- Breadcrumb mobile -->
            <div class="lg:hidden mb-6 flex items-center gap-2 text-sm text-white/70">
              <a routerLink="/" class="hover:text-white">Accueil</a>
              <i class="fa-solid fa-chevron-right text-xs"></i>
              <span class="text-white">Inscription</span>
            </div>

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
                    class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
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
                    class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
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
                  class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                  [class.border-red-400]="isInvalid('email')"
                  placeholder="vous@exemple.com"
                />
                @if (isInvalid('email')) {
                <p class="mt-1 text-sm text-red-200">
                  {{
                    registerForm.get('email')?.hasError('required')
                      ? 'Ce champ est requis'
                      : 'Format d'email invalide'
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
                      class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                      [class.border-red-400]="isInvalid('password')"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg text-white/90 hover:bg-white/15"
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
                      class="w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                      [class.border-red-400]="confirmInvalid()"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-lg text-white/90 hover:bg-white/15"
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

              <!-- Avantages de l'inscription (rappel mobile) -->
              <div class="lg:hidden bg-white/5 rounded-xl p-4 border border-white/20">
                <div class="text-sm text-white/90 font-medium mb-3">Avec votre compte :</div>
                <div class="grid grid-cols-2 gap-3 text-xs text-white/80">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-cart-shopping text-blue-400"></i>
                    <span>Panier sauvegardé</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-heart text-pink-400"></i>
                    <span>Liste de favoris</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-truck text-green-400"></i>
                    <span>Suivi commandes</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-bell text-purple-400"></i>
                    <span>Alertes artistes</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="registerForm.invalid || loading()"
                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600/90 text-white px-4 py-2 font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy="{{ loading() }}"
              >
                @if (loading()) {
                <span
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></span>
                Création du compte... } @else {
                <i class="fa-solid fa-user-plus"></i>
                Créer mon compte }
              </button>

              @if (error()) {
              <div
                class="rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-50"
              >
                {{ error() }}
              </div>
              }
            </form>

            <!-- Continuer sans compte - Mobile -->
            <div class="lg:hidden mt-8 pt-6 border-t border-white/20">
              <div class="text-center">
                <p class="text-sm text-white/80 mb-4">Pas encore prêt à créer un compte ?</p>
                <a
                  routerLink="/catalog"
                  class="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-sm border border-white/20"
                >
                  <i class="fa-solid fa-eye"></i>
                  Explorer le catalogue
                </a>
                <p class="text-xs text-white/60 mt-2">
                  L'inscription n'est pas obligatoire pour naviguer
                </p>
              </div>
            </div>

            <!-- Note sur la confidentialité -->
            <div class="mt-6 text-xs text-white/70 text-center">
              <p>
                En créant un compte, vous acceptez nos
                <a href="/legal/terms" class="underline hover:text-white"
                  >conditions d'utilisation</a
                >
                et notre
                <a href="/legal/privacy" class="underline hover:text-white"
                  >politique de confidentialité</a
                >.
              </p>
            </div>
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

  // même fond que le login
  bgUrl = 'assets/hero/login-bg.jpg';

  loading = signal(false);
  error = signal<string | null>(null);
  showMobileMenu = signal(false);

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

  toggleMobileMenu() {
    this.showMobileMenu.update((v) => !v);
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
