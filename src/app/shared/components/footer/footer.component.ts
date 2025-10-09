import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { CategoryService } from '../../../features/catalog/services/category';
import { Category } from '../../../features/catalog/models/category.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-gray-900 text-gray-200 mt-16" role="contentinfo">
      <!-- Newsletter -->
      <section class="border-b border-gray-800 bg-gray-900/80">
        <div class="container-wide py-8">
          <div class="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold text-white">Restez informé</h2>
              <p class="text-sm text-gray-400 mt-1">
                Nouveautés, promos, coulisses d’artistes — 1 à 2 emails / mois, pas de spam.
              </p>
            </div>

            <form
              class="flex flex-col gap-3"
              [formGroup]="form"
              (ngSubmit)="subscribe()"
              aria-label="Inscription à la newsletter"
              novalidate
            >
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1">
                  <label for="nl-email" class="sr-only">Email</label>
                  <input
                    id="nl-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    inputmode="email"
                    class="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-gray-100 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="votre@email.com"
                    [attr.aria-invalid]="
                      emailCtrl.invalid && (emailCtrl.touched || submitted()) ? 'true' : null
                    "
                    [attr.aria-describedby]="
                      emailCtrl.invalid && (emailCtrl.touched || submitted())
                        ? 'nl-email-error'
                        : null
                    "
                  />
                  @if (emailCtrl.touched && emailCtrl.invalid) {
                  <p id="nl-email-error" class="mt-1 text-xs text-red-400">
                    {{ emailErrorMessage() }}
                  </p>
                  }
                </div>

                <button
                  class="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                         bg-blue-600 text-white font-medium hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="form.invalid || loading()"
                  [attr.aria-busy]="loading() ? 'true' : null"
                >
                  <span class="inline-flex items-center gap-2">
                    @if (loading()) { <i class="fa-solid fa-spinner fa-spin"></i> }
                    <span>{{ loading() ? 'Inscription...' : 'S’abonner' }}</span>
                  </span>
                </button>
              </div>

              <!-- Consentement RGPD -->
              <label class="flex items-start gap-2 text-xs text-gray-400 select-none">
                <input
                  type="checkbox"
                  formControlName="consent"
                  class="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-600"
                />
                <span>
                  J’accepte de recevoir des emails d’Art Shop. Je peux me désabonner à tout moment.
                  <a routerLink="/legal/privacy" class="underline hover:text-white"
                    >En savoir plus</a
                  >.
                </span>
              </label>

              <!-- Honeypot anti-bot -->
              <div class="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
                <label for="website">Votre site web (laisser vide)</label>
                <input id="website" type="text" formControlName="honeypot" autocomplete="off" />
              </div>

              <!-- Zone d’état accessible -->
              <div class="status-line text-sm" aria-live="polite">
                @if (subscribed()) {
                <div class="text-green-400">Merci ! Votre inscription est prise en compte ✅</div>
                } @else if (errorMsg()) {
                <div class="text-red-400">{{ errorMsg() }}</div>
                }
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Liens -->
      <section class="container-wide py-10">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          <!-- Brand -->
          <div class="col-span-2 lg:col-span-2">
            <a routerLink="/" class="inline-flex items-center gap-2">
              <div
                class="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600
                        flex items-center justify-center"
                aria-hidden="true"
              >
                <span class="text-white font-bold text-sm">AS</span>
              </div>
              <span class="text-white font-semibold text-lg">Art Shop</span>
            </a>
            <p class="mt-3 text-sm text-gray-400">
              Marketplace de dessins et d’art imprimé. Pièces uniques et séries limitées.
            </p>
            <div class="mt-4 flex items-center gap-3" aria-label="Réseaux sociaux">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener"
                class="hover:text-white"
                aria-label="Instagram"
                >📷</a
              >
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener"
                class="hover:text-white"
                aria-label="Twitter / X"
                >🐦</a
              >
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener"
                class="hover:text-white"
                aria-label="TikTok"
                >🎵</a
              >
            </div>
          </div>

          <!-- Catalogue -->
          <div>
            <h3 class="text-sm font-semibold text-white">Catalogue</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li>
                <a routerLink="/catalog" class="text-gray-400 hover:text-white"
                  >Tous les articles</a
                >
              </li>
              <li>
                <a
                  [routerLink]="['/catalog']"
                  [queryParams]="{ promo: 'true' }"
                  class="text-gray-400 hover:text-white"
                  >Promotions</a
                >
              </li>
              @for (category of categories(); track category.id) {
              <li>
                <a
                  [routerLink]="['/catalog']"
                  [queryParams]="{ categorySlug: category.slug }"
                  class="text-gray-400 hover:text-white"
                  >{{ category.name }}</a
                >
              </li>
              }
            </ul>
          </div>

          <!-- Compte -->
          <div>
            <h3 class="text-sm font-semibold text-white">Mon compte</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li><a routerLink="/profile" class="text-gray-400 hover:text-white">Profil</a></li>
              <li>
                <a routerLink="/profile/orders" class="text-gray-400 hover:text-white"
                  >Mes commandes</a
                >
              </li>
              <li>
                <a routerLink="/favorites" class="text-gray-400 hover:text-white">Mes favoris</a>
              </li>
              <li><a routerLink="/cart" class="text-gray-400 hover:text-white">Mon panier</a></li>
            </ul>
          </div>

          <!-- Aide -->
          <div>
            <h3 class="text-sm font-semibold text-white">Aide</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li>
                <a routerLink="/help" class="text-gray-400 hover:text-white">Centre d’aide</a>
              </li>
              <li><a routerLink="/contact" class="text-gray-400 hover:text-white">Contact</a></li>
              <li><a routerLink="/legal/faq" class="text-gray-400 hover:text-white">FAQ</a></li>
              <li>
                <a routerLink="/legal/shipping" class="text-gray-400 hover:text-white"
                  >Livraison & retours</a
                >
              </li>
              <li>
                <a routerLink="/legal/privacy" class="text-gray-400 hover:text-white"
                  >Confidentialité</a
                >
              </li>
            </ul>
          </div>
        </div>

        <!-- Bas de page -->
        <div
          class="mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
        >
          <p class="text-xs text-gray-400">© {{ year }} Art Shop — Tous droits réservés.</p>
          <div class="flex flex-wrap gap-4 text-xs text-gray-400">
            <a routerLink="/legal/terms" class="hover:text-white">Conditions générales</a>
            <a routerLink="/legal/privacy" class="hover:text-white">Politique de confidentialité</a>
            <a routerLink="/legal/cookies" class="hover:text-white">Cookies</a>
          </div>
        </div>
      </section>
    </footer>
  `,
  styles: [
    `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .status-line {
        min-height: 1.25rem;
      }
    `,
  ],
})
export class FooterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly categoryService = inject(CategoryService);

  year = new Date().getFullYear();
  loading = signal(false);
  subscribed = signal(false);
  submitted = signal(false);
  errorMsg = signal<string | null>(null);
  categories = signal<Category[]>([]);

  private static EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(FooterComponent.EMAIL_RX)]],
    consent: [false, [Validators.requiredTrue]],
    honeypot: [''],
  });

  async ngOnInit(): Promise<void> {
    try {
      const allCategories = await this.categoryService.getAll();
      // Ne garder que les catégories actives
      this.categories.set(allCategories.filter((c) => c.isActive));
    } catch {
      // En cas d'erreur, on laisse la liste vide
      this.categories.set([]);
    }
  }

  get emailCtrl(): AbstractControl {
    return this.form.controls.email;
  }

  emailErrorMessage(): string {
    if (this.emailCtrl.hasError('required')) return 'L’email est requis.';
    if (this.emailCtrl.hasError('pattern') || this.emailCtrl.hasError('email'))
      return 'Veuillez saisir un email valide.';
    return 'Email invalide.';
  }

  async subscribe() {
    this.submitted.set(true);
    this.errorMsg.set(null);
    this.subscribed.set(false);

    // anti-bot: si le honeypot est rempli, on “réussit” silencieusement
    if (this.form.value.honeypot) {
      this.subscribed.set(true);
      this.form.reset({ email: '', consent: false, honeypot: '' });
      this.toast.success('Inscription à la newsletter réussie !');
      return;
    }

    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      this.subscribed.set(true);
      this.form.reset({ email: '', consent: false, honeypot: '' });
      this.toast.success('Inscription à la newsletter réussie !');
    } catch {
      this.errorMsg.set('Une erreur est survenue. Merci de réessayer dans un instant.');
    } finally {
      this.loading.set(false);
    }
  }
}
