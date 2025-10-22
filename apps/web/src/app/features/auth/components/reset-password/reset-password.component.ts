import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthHttpService as AuthService } from '../../services/auth-http.service';
import { HttpErrorResponse } from '@angular/common/http';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./reset-password.component.scss'],
  template: `
    <!-- Fond -->
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
    <div class="auth-shell mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-16">
      <section class="relative w-full">
        <div class="absolute -inset-4 rounded-[2rem] bg-black/35 blur-2xl"></div>

        <div
          class="relative backdrop-blur-3xl bg-white/15 border border-white/40 shadow-[0_20px_80px_rgba(0,0,0,.35)] ring-1 ring-white/20 rounded-3xl p-8 sm:p-10"
        >
          <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-white drop-shadow">
              Définir un nouveau mot de passe
            </h1>
            <p class="text-sm text-white/80 mt-2">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="password" class="block text-sm font-medium text-white/90"
                  >Nouveau mot de passe</label
                >
                <input
                  id="password"
                  [type]="show() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                  [class.border-red-400]="isInvalid('password')"
                  placeholder="••••••••"
                />
                @if (isInvalid('password')) {
                <p class="mt-1 text-sm text-red-200">Minimum 6 caractères</p>
                }
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-white/90"
                  >Confirmer</label
                >
                <input
                  id="confirmPassword"
                  [type]="show() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  class="mt-1 w-full rounded-xl border border-white/50 bg-white/30 text-white placeholder-white/70 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-300/80"
                  [class.border-red-400]="confirmInvalid()"
                  placeholder="••••••••"
                />
                @if (confirmInvalid()) {
                <p class="mt-1 text-sm text-red-200">Les mots de passe ne correspondent pas</p>
                }
              </div>
            </div>

            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-2 text-sm text-white/90 select-none">
                <input
                  type="checkbox"
                  (change)="toggleShow($event)"
                  class="h-4 w-4 rounded border-white/50 bg-white/30 text-blue-300 focus:ring-blue-300"
                />
                Afficher les mots de passe
              </label>
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600/90 text-white px-4 py-2 font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy="{{ loading() }}"
            >
              @if (loading()) {
              <span
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              Mise à jour... } @else { Mettre à jour le mot de passe }
            </button>

            @if (error()) {
            <div
              class="rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-50"
            >
              {{ error() }}
            </div>
            }
          </form>

          <div class="mt-6 text-center">
            <a routerLink="/auth/login" class="text-sm text-blue-200 hover:text-white underline"
              >Retour à la connexion</a
            >
          </div>
        </div>
      </section>
    </div>
  `,
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  bgUrl = 'assets/hero/login-bg.jpg';

  loading = signal(false);
  error = signal<string | null>(null);
  show = signal(false);

  form = this.fb.group(
    {
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
    },
    { validators: [passwordsMatch] }
  );

  toggleShow(e: Event) {
    this.show.set((e.target as HTMLInputElement).checked);
  }
  showPasswords() {
    return this.show();
  }

  isInvalid(name: 'password') {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
  confirmInvalid() {
    const c = this.form.get('confirmPassword');
    const mismatch = this.form.hasError('passwordsMismatch');
    return !!((c && c.invalid && (c.dirty || c.touched)) || mismatch);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const token = this.route.snapshot.paramMap.get('token') ?? '';
    const { password, confirmPassword } = this.form.getRawValue();

    try {
      const res = await this.auth.resetPassword({ token, password, confirmPassword });
      this.loading.set(false);

      if (res.success) {
        // Toast succès
        this.toast.success('Mot de passe mis à jour.');
        // Redirection login
        this.router.navigateByUrl('/auth/login');
      } else {
        // Toast erreur API
        this.toast.error(res.error ?? 'Échec de la mise à jour du mot de passe.');
        this.error.set(res.error ?? 'Échec de la mise à jour du mot de passe.');
      }
    } catch (e) {
      this.loading.set(false);
      const msg =
        e instanceof HttpErrorResponse
          ? e.error?.message ?? 'Erreur lors de la mise à jour.'
          : e instanceof Error
          ? e.message
          : 'Erreur lors de la mise à jour.';

      // Toast erreur exception
      this.toast.error(msg);
      this.error.set(msg);
    }
  }
}
