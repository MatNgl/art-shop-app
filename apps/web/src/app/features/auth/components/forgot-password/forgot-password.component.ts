import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService, BasicResponse } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

interface ResetRequestResponse extends BasicResponse {
  devToken?: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./forgot-password.component.scss'],
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
            <h1 class="text-2xl font-bold text-white drop-shadow">Mot de passe oublié</h1>
            <p class="text-sm text-white/80 mt-2">
              Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
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
                  form.get('email')?.hasError('required')
                    ? 'Ce champ est requis'
                    : "Format d'email invalide"
                }}
              </p>
              }
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/90 text-white px-4 py-2 font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy="{{ loading() }}"
            >
              @if (loading()) {
              <span
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              Envoi en cours... } @else { Envoyer le lien }
            </button>

            @if (info()) {
            <div
              class="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-50"
            >
              {{ info() }}
            </div>
            } @if (error()) {
            <div
              class="rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-50"
            >
              {{ error() }}
            </div>
            }

            <!-- Bouton DEV -->
            @if (devToken()) {
            <div class="mt-4 text-center">
              <a
                [routerLink]="['/auth/reset', devToken()]"
                class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-700 text-white"
              >
                <i class="fa-solid fa-flask"></i>
                Tester le lien DEV
              </a>
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
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  devToken = signal<string | null>(null);

  bgUrl = 'assets/hero/login-bg.jpg';

  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  form = this.fb.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
  });

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.form.patchValue({ email });
  }

  isInvalid(name: 'email') {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    const { email } = this.form.getRawValue();

    try {
      const res: ResetRequestResponse = await this.auth.requestPasswordReset({ email });
      this.loading.set(false);

      if (res.success) {
        this.toast.success('Email de réinitialisation envoyé (si le compte existe).');
        this.info.set(
          res.message ??
            'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.'
        );

        if (res.devToken) {
          const link = `/auth/reset/${res.devToken}`;
          this.toast.info(`Lien de test : ${link}`, 'DEV');
          try {
            await navigator.clipboard.writeText(link);
            this.toast.info('Lien copié dans le presse-papiers', 'DEV');
          } catch {
            /* ignore si navigateur refuse */
          }
        }
      } else {
        this.toast.error(res.error ?? 'Impossible d’envoyer le lien.');
        this.error.set(res.error ?? 'Impossible d’envoyer le lien.');
      }
    } catch (e) {
      this.loading.set(false);
      const msg =
        e instanceof HttpErrorResponse
          ? e.error?.message ?? 'Erreur lors de l’envoi.'
          : e instanceof Error
          ? e.message
          : 'Erreur lors de l’envoi.';

      this.toast.error(msg);
      this.error.set(msg);
    }
  }
}
