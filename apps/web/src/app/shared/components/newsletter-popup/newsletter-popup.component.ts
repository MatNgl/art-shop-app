import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../../features/auth/services/auth';

@Component({
  selector: 'app-newsletter-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isVisible()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      (click)="onBackdropClick($event)"
      (keydown.escape)="close()"
      tabindex="-1"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
        role="document"
      >
        <!-- Close button -->
        <button
          type="button"
          (click)="close()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Fermer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Header avec image -->
        <div class="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center text-white p-6">
              <svg
                class="w-16 h-16 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h2 class="text-2xl font-bold">Restez informé !</h2>
              <p class="text-sm opacity-90 mt-1">Recevez nos dernières nouveautés et offres</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <form [formGroup]="form" (ngSubmit)="subscribe()">
            <div class="space-y-4">
              <div>
                <label for="newsletter-email" class="block text-sm font-medium text-gray-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  formControlName="email"
                  placeholder="votre@email.com"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [class.border-red-500]="form.get('email')?.invalid && form.get('email')?.touched"
                />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Adresse e-mail invalide</p>
                }
              </div>

              <div class="flex items-start gap-2">
                <input
                  id="newsletter-consent"
                  type="checkbox"
                  formControlName="consent"
                  class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="newsletter-consent" class="text-xs text-gray-600">
                  J'accepte de recevoir des e-mails promotionnels et je peux me désabonner à tout
                  moment
                </label>
              </div>

              <button
                type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading() ? 'Inscription...' : "S'inscrire à la newsletter" }}
              </button>

              <button
                type="button"
                (click)="dismiss()"
                class="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Non merci, peut-être plus tard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    }
  `,
})
export class NewsletterPopupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  private readonly STORAGE_KEY = 'newsletter_popup_dismissed';
  private readonly DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

  isVisible = signal(false);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    consent: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    // Vérifier si l'utilisateur a déjà dismissé la popup récemment
    const dismissedUntil = localStorage.getItem(this.STORAGE_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const user = this.authService.getCurrentUser();

    // 🔒 Ne jamais afficher pour les admins
    if (user?.role === 'admin') {
      return;
    }

    if (user?.email) {
      this.form.patchValue({ email: user.email });
    }

    // Afficher la popup après 5 secondes
    setTimeout(() => {
      this.isVisible.set(true);
    }, 5000);
  }

  async subscribe(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);

    try {
      const { email } = this.form.getRawValue();

      // Simuler l'inscription (en prod: appel API backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stocker l'inscription
      const subscriptions = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
      if (!subscriptions.includes(email)) {
        subscriptions.push(email);
        localStorage.setItem('newsletter_subscriptions', JSON.stringify(subscriptions));
      }

      this.toast.success('Merci pour votre inscription ! 🎉');
      this.close();
    } catch {
      this.toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      this.loading.set(false);
    }
  }

  dismiss(): void {
    // Masquer la popup pour 7 jours
    const dismissUntil = Date.now() + this.DISMISS_DURATION;
    localStorage.setItem(this.STORAGE_KEY, dismissUntil.toString());
    this.close();
  }

  close(): void {
    this.isVisible.set(false);
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
