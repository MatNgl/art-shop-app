import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <footer class="bg-gray-900 text-gray-200 mt-16" role="contentinfo">
      <!-- Newsletter -->
      <section class="border-b border-gray-800 bg-gray-900/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold text-white">Restez informé</h2>
              <p class="text-sm text-gray-400 mt-1">
                Nouveautés, promos, coulisses d’artistes — 1 à 2 emails / mois, pas de spam.
              </p>
            </div>

            <form class="flex flex-col sm:flex-row gap-3" [formGroup]="form" (ngSubmit)="subscribe()"
                  aria-label="Inscription à la newsletter">
              <div class="flex-1">
                <label for="nl-email" class="sr-only">Email</label>
                <input
                  id="nl-email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-gray-100 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="votre@email.com" />
                @if (form.controls.email.touched && form.controls.email.invalid) {
                  <p class="mt-1 text-xs text-red-400">Veuillez saisir un email valide.</p>
                }
              </div>

              <button
                class="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                       bg-blue-600 text-white font-medium hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="form.invalid || loading()">
                {{ loading() ? 'Inscription...' : 'S’abonner' }}
              </button>
            </form>
          </div>

          @if (subscribed()) {
            <div class="mt-3 text-sm text-green-400">
              Merci ! Votre inscription est prise en compte ✅
            </div>
          }
        </div>
      </section>

      <!-- Liens -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          <!-- Brand -->
          <div class="col-span-2 lg:col-span-2">
            <a routerLink="/" class="inline-flex items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600
                          flex items-center justify-center">
                <span class="text-white font-bold text-sm">AS</span>
              </div>
              <span class="text-white font-semibold text-lg">Art Shop</span>
            </a>
            <p class="mt-3 text-sm text-gray-400">
              Marketplace de dessins et d’art imprimé. Pièces uniques et séries limitées.
            </p>
            <div class="mt-4 flex items-center gap-3" aria-label="Réseaux sociaux">
              <a href="#" class="hover:text-white" aria-label="Instagram">📷</a>
              <a href="#" class="hover:text-white" aria-label="Twitter / X">🐦</a>
              <a href="#" class="hover:text-white" aria-label="TikTok">🎵</a>
            </div>
          </div>

          <!-- Catalogue -->
          <div>
            <h3 class="text-sm font-semibold text-white">Catalogue</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li><a routerLink="/catalog" class="text-gray-400 hover:text-white">Tous les articles</a></li>
              <li><a [routerLink]="['/catalog']" [queryParams]="{ category: 'drawing' }" class="text-gray-400 hover:text-white">Dessins</a></li>
              <li><a [routerLink]="['/catalog']" [queryParams]="{ category: 'painting' }" class="text-gray-400 hover:text-white">Peintures</a></li>
              <li><a [routerLink]="['/catalog']" [queryParams]="{ category: 'digital-art' }" class="text-gray-400 hover:text-white">Art numérique</a></li>
              <li><a [routerLink]="['/catalog']" [queryParams]="{ category: 'photography' }" class="text-gray-400 hover:text-white">Photographie</a></li>
            </ul>
          </div>

          <!-- Compte -->
          <div>
            <h3 class="text-sm font-semibold text-white">Mon compte</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li><a routerLink="/profile" class="text-gray-400 hover:text-white">Profil</a></li>
              <li><a routerLink="/profile/orders" class="text-gray-400 hover:text-white">Mes commandes</a></li>
              <li><a routerLink="/profile/favorites" class="text-gray-400 hover:text-white">Mes favoris</a></li>
              <li><a routerLink="/cart" class="text-gray-400 hover:text-white">Mon panier</a></li>
            </ul>
          </div>

          <!-- Aide -->
          <div>
            <h3 class="text-sm font-semibold text-white">Aide</h3>
            <ul class="mt-4 space-y-2 text-sm">
              <li><a routerLink="/help" class="text-gray-400 hover:text-white">Centre d’aide</a></li>
              <li><a routerLink="/contact" class="text-gray-400 hover:text-white">Contact</a></li>
              <li><a routerLink="/legal/faq" class="text-gray-400 hover:text-white">FAQ</a></li>
              <li><a routerLink="/legal/shipping" class="text-gray-400 hover:text-white">Livraison & retours</a></li>
              <li><a routerLink="/legal/privacy" class="text-gray-400 hover:text-white">Confidentialité</a></li>
            </ul>
          </div>
        </div>

        <!-- Bas de page -->
        <div class="mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p class="text-xs text-gray-400">
            © {{ year }} Art Shop — Tous droits réservés.
          </p>
          <div class="flex flex-wrap gap-4 text-xs text-gray-400">
            <a routerLink="/legal/terms" class="hover:text-white">Conditions générales</a>
            <a routerLink="/legal/privacy" class="hover:text-white">Politique de confidentialité</a>
            <a routerLink="/legal/cookies" class="hover:text-white">Cookies</a>
          </div>
        </div>
      </section>
    </footer>
  `,
    styles: [`
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
  `],
})
export class FooterComponent {
    private readonly fb = inject(FormBuilder);

    year = new Date().getFullYear();
    loading = signal(false);
    subscribed = signal(false);

    form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
    });

    async subscribe() {
        if (this.form.invalid) return;
        this.loading.set(true);
        this.subscribed.set(false);
        try {
            // Mock “appel API”
            await new Promise(res => setTimeout(res, 600));
            this.subscribed.set(true);
            this.form.reset();
        } finally {
            this.loading.set(false);
        }
    }
}
