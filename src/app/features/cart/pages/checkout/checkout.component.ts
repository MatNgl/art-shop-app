import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { AuthService } from '../../../auth/services/auth';
import { OrderStore } from '../../services/order-store';
import { NgSelectModule } from '@ng-select/ng-select';
import { PricePipe } from '../../../../shared/pipes/pipe.price';

// i18n-iso-countries (assure-toi que resolveJsonModule est activé dans tsconfig)
// et que tu as importé les styles globaux :
//   @import '@ng-select/ng-select/themes/default.theme.css';
//   @import 'flag-icons/css/flag-icons.min.css';
import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

interface CountryOpt {
  code: string; // ISO-2
  name: string; // label FR
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgSelectModule, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Finaliser la commande</h1>

      @if (cart.empty()) {
        <div class="bg-white p-6 rounded-xl shadow">
          <p>Votre panier est vide.</p>
          <a class="text-primary-600 underline" routerLink="/">Retour à la boutique</a>
        </div>
      } @else {
        <div class="grid md:grid-cols-3 gap-6">
          <form
            class="md:col-span-2 bg-white p-6 rounded-xl shadow space-y-6"
            [formGroup]="form"
            (ngSubmit)="submit()"
          >
            <section>
              <h2 class="font-semibold mb-4">Informations de contact</h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="firstName">Prénom</label>
                  <input id="firstName" class="input" placeholder="Prénom" formControlName="firstName" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="lastName">Nom</label>
                  <input id="lastName" class="input" placeholder="Nom" formControlName="lastName" />
                </div>
              </div>
              <div class="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="email">Email</label>
                  <input id="email" class="input" placeholder="Email" formControlName="email" type="email" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="phone">Téléphone (optionnel)</label>
                  <input id="phone" class="input" placeholder="+33 ..." formControlName="phone" />
                </div>
              </div>
            </section>

            <section>
              <h2 class="font-semibold mb-4">Adresse</h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-600 mb-1" for="street">Rue</label>
                  <input id="street" class="input" placeholder="Rue" formControlName="street" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="city">Ville</label>
                  <input id="city" class="input" placeholder="Ville" formControlName="city" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="zip">Code postal</label>
                  <input id="zip" class="input" placeholder="Code postal" formControlName="zip" />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-600 mb-1" for="country">Pays</label>
                  <ng-select
                    id="country"
                    class="input ng-country"
                    formControlName="country"
                    [items]="countries()"
                    bindLabel="name"
                    bindValue="code"
                    [searchable]="true"
                    [clearable]="false"
                    placeholder="Choisir un pays…"
                  >
                    <ng-template ng-option-tmp let-item="item">
                      <span [class]="flagClass(item.code)"></span>
                      <span class="ml-2">{{ item.name }}</span>
                    </ng-template>
                    <ng-template ng-label-tmp let-item="item">
                      <span [class]="flagClass(item.code)"></span>
                      <span class="ml-2">{{ item.name }}</span>
                    </ng-template>
                  </ng-select>
                </div>
              </div>
            </section>

            <section>
              <h2 class="font-semibold mb-4">Paiement (simulation)</h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="method">Méthode</label>
                  <select id="method" class="input" formControlName="method">
                    <option value="card">Carte</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Virement</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1" for="last4">4 derniers chiffres (optionnel)</label>
                  <input id="last4" class="input" placeholder="1234" formControlName="last4" maxlength="4" />
                </div>
              </div>
            </section>

            <button
              class="w-full py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              [disabled]="form.invalid || loading()"
            >
              {{ loading() ? 'Traitement...' : 'Payer et passer la commande' }}
            </button>
          </form>

          <aside class="bg-white p-6 rounded-xl shadow h-fit">
            <h2 class="font-semibold mb-4">Récapitulatif</h2>
            <ul class="divide-y">
              @for (it of cart.items(); track it.productId) {
                <li class="py-3 flex justify-between text-sm">
                  <span>{{ it.title }} × {{ it.qty }}</span>
                  <span>{{ it.unitPrice * it.qty | price }}</span>
                </li>
              }
            </ul>
            <div class="mt-4 space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Sous-total</span><span>{{ cart.subtotal() | price }}</span>
              </div>
              <div class="flex justify-between">
                <span>Taxes</span><span>{{ cart.taxes() | price }}</span>
              </div>
              <div class="border-t pt-2 font-semibold flex justify-between text-base">
                <span>Total</span><span>{{ cart.total() | price }}</span>
              </div>
            </div>

            <p class="mt-3 text-xs text-gray-500">
              Taxes incluses. <span class="underline decoration-dotted">Frais d’expédition</span>
              calculés à l’étape de paiement.
            </p>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .input {
        @apply w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600;
      }
      /* Alignement drapeau+libellé dans ng-select */
      .ng-country .fi {
        margin-right: 0.5rem;
      }
      .ng-country ::ng-deep .ng-option,
      .ng-country ::ng-deep .ng-value {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class CheckoutComponent {
  cart = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderStore);
  private readonly router = inject(Router);

  loading = signal(false);

  countries = signal<CountryOpt[]>(this.buildCountries());

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    street: ['', Validators.required],
    city: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]], // ISO-2
    method: this.fb.nonNullable.control<'card' | 'paypal' | 'bank'>('card'),
    last4: [''],
  });

  constructor() {
    const u = this.auth.currentUser$();
    if (u) {
      this.form.patchValue({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        street: u.address?.street ?? '',
        city: u.address?.city ?? '',
        zip: u.address?.postalCode ?? '',
        country: u.address?.country ?? 'FR', // code ISO-2
      });
    }
  }

  /** Construit la liste FR des pays (avec France en tête). */
  private buildCountries(): CountryOpt[] {
    try {
      isoCountries.registerLocale(frLocale as unknown as LocaleData);
      const names = isoCountries.getNames('fr', { select: 'official' }) as Record<string, string>;
      const list = Object.entries(names)
        .filter(([code]) => /^[A-Z]{2}$/.test(code))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      const i = list.findIndex(x => x.code === 'FR');
      if (i > 0) {
        const [fr] = list.splice(i, 1);
        list.unshift(fr);
      }
      return list;
    } catch {
      // Fallback minimal si la locale n'est pas dispo
      return [
        { code: 'FR', name: 'France' },
        { code: 'BE', name: 'Belgique' },
        { code: 'CH', name: 'Suisse' },
        { code: 'DE', name: 'Allemagne' },
        { code: 'IT', name: 'Italie' },
        { code: 'ES', name: 'Espagne' },
        { code: 'PT', name: 'Portugal' },
        { code: 'GB', name: 'Royaume-Uni' },
        { code: 'US', name: 'États-Unis' },
        { code: 'CA', name: 'Canada' },
        { code: 'ZA', name: 'Afrique du Sud' },
      ];
    }
  }

  /** Classe CSS pour le drapeau (flag-icons). */
  flagClass(code: string): string {
    return `fi fi-${code.toLowerCase()}`;
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const v = this.form.getRawValue();
      const order = await this.orders.placeOrder(
        {
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone || undefined,
          address: { street: v.street, city: v.city, zip: v.zip, country: v.country }, // country ISO-2
        },
        { method: v.method, last4: v.last4 || undefined }
      );

      this.router.navigate(['/cart/confirmation', order.id]);
    } catch (e) {
      console.error(e);
      alert('Échec du paiement (simulation).');
    } finally {
      this.loading.set(false);
    }
  }
}
