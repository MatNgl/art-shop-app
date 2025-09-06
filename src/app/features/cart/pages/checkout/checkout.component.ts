import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { AuthService } from '../../../auth/services/auth';
import { OrderStore } from '../../services/order-store';
import { NgSelectModule } from '@ng-select/ng-select';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

// Coupons
import { DiscountService, DiscountRule } from '../../../../shared/services/discount.service';

// Téléphone
import { FrPhoneMaskDirective } from '../../../../shared/directives/fr-phone-mask.directive';
import { FrPhonePipe } from '../../../../shared/pipes/fr-phone.pipe';

interface CountryOpt {
  code: string;
  name: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    PricePipe,
    FrPhoneMaskDirective,
    FrPhonePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./checkout.component.scss'],
  template: `
    <div class="page">
      <div class="container">
        <!-- Colonne formulaire -->
        <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
          <!-- Debug info - à supprimer en production -->
          <div *ngIf="showDebug()" class="p-4 bg-red-100 rounded-lg mb-4">
            <h3 class="font-bold text-red-800">Debug - Erreurs de validation :</h3>
            <div class="text-sm text-red-700">
              <div *ngFor="let error of getFormErrors()">{{ error }}</div>
              <div class="mt-2">
                <strong>Form valid:</strong> {{ form.valid }}<br />
                <strong>Form errors:</strong> {{ form.errors | json }}<br />
                <strong>Loading:</strong> {{ loading() }}
              </div>
            </div>
          </div>

          <!-- Contact -->
          <section class="section">
            <div
              *ngIf="form.invalid && form.touched"
              class="p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
            >
              <div class="flex items-center gap-2 text-red-700">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm font-medium"
                  >Veuillez corriger les erreurs ci-dessous avant de continuer.</span
                >
              </div>
            </div>
            <h2>Contact</h2>
            <div class="field">
              <label for="email">Adresse e-mail</label>
              <input
                id="email"
                class="input"
                type="email"
                formControlName="email"
                [readOnly]="true"
              />
              <p class="hint">Vous êtes connecté·e. L'adresse e-mail est préremplie.</p>
            </div>
            <label class="checkbox">
              <input type="checkbox" formControlName="newsletter" />
              <span>Envoyez-moi des nouvelles et des offres par e-mail</span>
            </label>
          </section>

          <!-- Livraison -->
          <section class="section">
            <h2>Livraison</h2>

            <div class="grid-2">
              <div class="field">
                <label for="country">Pays/région *</label>
                <ng-select
                  id="country"
                  class="input ng-country"
                  [class.invalid]="form.get('country')?.invalid && form.get('country')?.touched"
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
                <p class="err" *ngIf="form.get('country')?.invalid && form.get('country')?.touched">
                  Veuillez sélectionner un pays.
                </p>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="firstName">Prénom *</label>
                <input
                  id="firstName"
                  class="input"
                  [class.invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched"
                  formControlName="firstName"
                />
                <p
                  class="err"
                  *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched"
                >
                  Le prénom est requis (minimum 2 caractères).
                </p>
              </div>
              <div class="field">
                <label for="lastName">Nom *</label>
                <input id="lastName" class="input" formControlName="lastName" />
                <p
                  class="err"
                  *ngIf="form.get('lastName')?.invalid && form.get('lastName')?.touched"
                >
                  Le nom est requis (minimum 2 caractères).
                </p>
              </div>
            </div>

            <div class="field">
              <label for="company">Entreprise (optionnel)</label>
              <input id="company" class="input" formControlName="company" />
            </div>

            <div class="field">
              <label for="street">Adresse *</label>
              <input
                id="street"
                class="input"
                formControlName="street"
                placeholder="Numéro et rue"
              />
              <p class="err" *ngIf="form.get('street')?.invalid && form.get('street')?.touched">
                L'adresse est requise.
              </p>
            </div>

            <div class="field">
              <label for="street2">Appartement, suite, etc. (optionnel)</label>
              <input id="street2" class="input" formControlName="street2" />
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="zip">Code postal *</label>
                <input
                  id="zip"
                  class="input"
                  formControlName="zip"
                  inputmode="numeric"
                  maxlength="5"
                  (input)="digitsOnly('zip', 5)"
                />
                <p class="err" *ngIf="form.get('zip')?.invalid && form.get('zip')?.touched">
                  Code postal français à 5 chiffres requis.
                </p>
              </div>
              <div class="field">
                <label for="city">Ville *</label>
                <input id="city" class="input" formControlName="city" />
                <p class="err" *ngIf="form.get('city')?.invalid && form.get('city')?.touched">
                  La ville est requise.
                </p>
              </div>
            </div>

            <div class="field">
              <label for="phone">Téléphone (optionnel)</label>
              <input
                id="phone"
                class="input"
                formControlName="phone"
                placeholder="06 11 22 33 44"
                appFrPhoneMask
              />
              <p class="hint" *ngIf="form.value.phone">
                Formaté : {{ form.value.phone | frPhone }}
              </p>
              <p class="err" *ngIf="form.get('phone')?.invalid && form.get('phone')?.touched">
                Format de téléphone français invalide.
              </p>
            </div>

            <label class="checkbox">
              <input type="checkbox" formControlName="remember" />
              <span>Sauvegarder mes coordonnées pour la prochaine fois</span>
            </label>
          </section>

          <!-- Mode d'expédition -->
          <section class="section">
            <h2>Mode d'expédition</h2>
            <div class="ship card" [class.muted]="!addressComplete()">
              <p *ngIf="!addressComplete()" class="muted-text">
                Saisissez votre adresse d'expédition pour voir les modes d'expédition disponibles.
              </p>

              <div *ngIf="addressComplete()" class="ship-options">
                <label class="radio">
                  <input
                    type="radio"
                    name="shipping"
                    [checked]="shipping() === 'standard'"
                    (change)="setShipping('standard')"
                  />
                  <span>Standard (3–5 j) — {{ standardPrice | price }}</span>
                </label>
                <label class="radio">
                  <input
                    type="radio"
                    name="shipping"
                    [checked]="shipping() === 'express'"
                    (change)="setShipping('express')"
                  />
                  <span>Express (24–48 h) — {{ expressPrice | price }}</span>
                </label>
              </div>
            </div>
          </section>

          <!-- Paiement (simulation) -->
          <section class="section">
            <h2>Paiement</h2>
            <p class="sub">Toutes les transactions sont sécurisées et chiffrées.</p>

            <div class="card card-credit">
              <div class="card-credit__header">
                <span>Carte de crédit</span>
                <div class="brands">
                  <span class="brand">VISA</span>
                  <span class="brand">MC</span>
                  <span class="brand">AMEX</span>
                </div>
              </div>

              <div class="field">
                <label for="cardNumber">Numéro de carte *</label>
                <input
                  id="cardNumber"
                  class="input"
                  [class.invalid]="
                    form.get('cardNumber')?.invalid && form.get('cardNumber')?.touched
                  "
                  formControlName="cardNumber"
                  inputmode="numeric"
                  maxlength="19"
                  placeholder="1234 5678 9012 3456"
                  (keydown)="handleCardBackspace($event)"
                  (input)="formatCardNumber($event, 'cardNumber', 16)"
                />
                <p
                  class="err"
                  *ngIf="form.get('cardNumber')?.invalid && form.get('cardNumber')?.touched"
                >
                  Numéro de carte invalide (16 chiffres requis).
                </p>
              </div>

              <div class="grid-2">
                <div class="field">
                  <label for="cardExpiry">Date d'expiration *</label>
                  <input id="cardExpiry" class="input" type="month" formControlName="cardExpiry" />
                  <p class="hint">Sélectionnez mois/année (ex: 2027-04).</p>
                  <p
                    class="err"
                    *ngIf="form.get('cardExpiry')?.invalid && form.get('cardExpiry')?.touched"
                  >
                    Date d'expiration requise.
                  </p>
                </div>
                <div class="field">
                  <label for="cardCvc">Code de sécurité *</label>
                  <input
                    id="cardCvc"
                    class="input"
                    formControlName="cardCvc"
                    inputmode="numeric"
                    maxlength="3"
                    placeholder="CVC"
                    (input)="digitsOnly('cardCvc', 3)"
                  />
                  <p
                    class="err"
                    *ngIf="form.get('cardCvc')?.invalid && form.get('cardCvc')?.touched"
                  >
                    Code CVC requis (3 chiffres).
                  </p>
                </div>
              </div>

              <div class="field">
                <label for="cardName">Nom sur la carte *</label>
                <input
                  id="cardName"
                  class="input"
                  formControlName="cardName"
                  placeholder="Comme indiqué sur la carte"
                />
                <p
                  class="err"
                  *ngIf="form.get('cardName')?.invalid && form.get('cardName')?.touched"
                >
                  Le nom sur la carte est requis.
                </p>
              </div>

              <label class="checkbox">
                <input type="checkbox" formControlName="billingSameAsShipping" />
                <span>Utiliser l'adresse d'expédition comme adresse de facturation</span>
              </label>
            </div>
          </section>

          <div class="flex gap-4">
            <button
              type="submit"
              class="btn-primary flex-1"
              [disabled]="loading() || form.invalid || cart.empty() || !addressComplete()"
              [class.opacity-50]="loading() || form.invalid || cart.empty() || !addressComplete()"
            >
              {{ loading() ? 'Traitement...' : 'Vérifier la commande' }}
            </button>
          </div>
        </form>

        <!-- Colonne récap (sticky) -->
        <aside class="card summary sticky">
          <div [formGroup]="promoForm" class="discount">
            <input
              class="input"
              placeholder="Code de réduction ou carte-cadeau"
              formControlName="promoCode"
            />
            <button type="button" class="btn-secondary" (click)="applyPromo()">Valider</button>
          </div>

          <!-- Message succès/erreur -->
          <div
            *ngIf="promoMessage()"
            class="alert"
            [class.alert-success]="promoMessage()?.type === 'success'"
            [class.alert-error]="promoMessage()?.type === 'error'"
          >
            {{ promoMessage()?.text }}
          </div>

          <ul class="items">
            @for (it of cart.items(); track it.productId) {
            <li class="item">
              <img class="thumb" [src]="productImage(it)" [alt]="it.title" loading="lazy" />
              <div class="meta">
                <span class="title">{{ it.title }} × {{ it.qty }}</span>
                <span class="price">{{ it.unitPrice * it.qty | price }}</span>
              </div>
            </li>
            }
          </ul>

          <div class="totals">
            <div class="row">
              <span>Sous-total</span>
              <span>{{ cart.subtotal() | price }}</span>
            </div>

            <div class="row" *ngIf="discountAmount() > 0">
              <span
                >Réduction<span *ngIf="promoRule()?.code"
                  >&nbsp;({{ promoRule()?.code }})</span
                ></span
              >
              <span>-{{ discountAmount() | price }}</span>
            </div>

            <div class="row">
              <span>Expédition</span>
              <span>
                {{ effectiveShippingCost() | price }}
                <ng-container *ngIf="promoRule()?.type === 'shipping_free'">
                  (offerte)</ng-container
                >
              </span>
            </div>

            <div class="row">
              <span>Taxes</span>
              <span>{{ cart.taxes() | price }}</span>
            </div>

            <div class="row total">
              <span>Total</span>
              <span>{{ totalWithShipping() | price }}</span>
            </div>
            <p class="small muted-text">Taxes incluses.</p>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class CheckoutComponent {
  cart = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly discounts = inject(DiscountService);

  // prix expédition
  readonly standardPrice = 0;
  readonly expressPrice = 6.9;

  loading = signal(false);
  shipping = signal<'standard' | 'express'>('standard');
  shippingCost = signal<number>(this.standardPrice);
  showDebug = signal(false); // Pour déboguer

  // coupons
  promoRule = signal<DiscountRule | null>(null);
  promoMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  discountAmount = signal<number>(0);

  countries = signal<CountryOpt[]>(this.buildCountries());

  /* ===== Validators ===== */
  private frPhoneValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return null; // optionnel

    const digits = String(value).replace(/\D/g, '');
    const normalized =
      digits.startsWith('33') && digits.length >= 11 ? '0' + digits.slice(2) : digits;

    if (normalized.length === 10 && normalized.startsWith('0')) {
      return null;
    }
    return { phoneFr: true };
  };

  private cardNumberValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };

    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 16) {
      return null;
    }
    return { cardNumber: true };
  };

  private cardExpiryValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };

    const v = String(value).trim();
    // Format YYYY-MM (input type="month")
    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    // Format MM/YY
    const slashPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;

    if (monthPattern.test(v) || slashPattern.test(v)) {
      return null;
    }
    return { cardExpiry: true };
  };

  private cardCvcValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };

    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 3) {
      return null;
    }
    return { cardCvc: true };
  };

  // Formulaire principal
  form = this.fb.nonNullable.group({
    // contact
    email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
    newsletter: [true],

    // livraison
    country: ['FR', [Validators.required]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    company: [''],
    street: ['', [Validators.required]],
    street2: [''],
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [this.frPhoneValidator]],

    remember: [false],

    // paiement (simulation) - tous requis
    method: this.fb.nonNullable.control<'card' | 'paypal' | 'bank'>('card'),
    last4: [''],
    cardNumber: ['', [this.cardNumberValidator]],
    cardExpiry: ['', [this.cardExpiryValidator]],
    cardCvc: ['', [this.cardCvcValidator]],
    cardName: ['', [Validators.required, Validators.minLength(2)]],

    // facturation
    billingSameAsShipping: [true],
  });

  // Formulaire séparé pour les promos (optionnel)
  promoForm: FormGroup = this.fb.nonNullable.group({
    promoCode: [''],
  });

  constructor() {
    const u = this.auth.currentUser$();
    if (u) {
      this.form.patchValue({
        email: u.email ?? '',
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        phone: u.phone ?? '',
        street: u.address?.street ?? '',
        city: u.address?.city ?? '',
        zip: u.address?.postalCode ?? '',
        country: u.address?.country ?? 'FR',
      });
    }
  }

  /* ===== Debug helpers ===== */
  toggleDebug() {
    this.showDebug.update((val) => !val);
  }

  getFormErrors(): string[] {
    const errors: string[] = [];

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        const controlErrors = control.errors;
        if (controlErrors) {
          Object.keys(controlErrors).forEach((errorKey) => {
            errors.push(`${key}: ${errorKey} - ${JSON.stringify(controlErrors[errorKey])}`);
          });
        }
      }
    });

    return errors;
  }

  /* ===== Helpers ===== */

  digitsOnly(controlName: 'zip' | 'cardCvc', max: number) {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;
    const digits = String(ctrl.value ?? '')
      .replace(/\D/g, '')
      .slice(0, max);
    ctrl.setValue(digits, { emitEvent: false });
  }

  formatCardNumber(ev: Event, controlName: 'cardNumber', max: number) {
    const input = ev.target as HTMLInputElement;
    const ctrl = this.form.get(controlName);
    if (!ctrl || !input) return;

    const rawBefore = input.value;
    const cursor = input.selectionStart ?? rawBefore.length;

    const digitsBeforeCursor = rawBefore.slice(0, cursor).replace(/\D/g, '').length;
    const digits = rawBefore.replace(/\D/g, '').slice(0, max);
    const formatted = (digits.match(/.{1,4}/g) || []).join(' ');

    ctrl.setValue(formatted, { emitEvent: false });
    input.value = formatted;

    let newPos = 0,
      seenDigits = 0;
    while (newPos < formatted.length && seenDigits < digitsBeforeCursor) {
      if (/\d/.test(formatted[newPos])) seenDigits++;
      newPos++;
    }
    input.setSelectionRange(newPos, newPos);
  }

  handleCardBackspace(ev: KeyboardEvent) {
    if (ev.key !== 'Backspace') return;
    const input = ev.target as HTMLInputElement;
    const pos = input.selectionStart ?? 0;
    const sel = input.selectionEnd ?? pos;

    if (pos === sel && pos > 0 && input.value[pos - 1] === ' ') {
      ev.preventDefault();
      const newPos = pos - 1;
      input.setSelectionRange(newPos, newPos);
      const before = input.value.slice(0, newPos - 1);
      const after = input.value.slice(newPos);
      input.value = before + after;
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
  }

  productImage(it: { productId: string | number; imageUrl?: string }): string {
    return it.imageUrl ?? `/assets/products/${it.productId}.jpg`;
  }

  /* ===== Adresse/expédition ===== */
  addressComplete(): boolean {
    const v = this.form.getRawValue();
    return !!(v.street && v.zip && v.city && v.country);
  }

  setShipping(type: 'standard' | 'express') {
    this.shipping.set(type);
    this.shippingCost.set(type === 'express' ? this.expressPrice : this.standardPrice);
  }

  /* ===== Coupons ===== */
  applyPromo() {
    const code = this.promoForm.get('promoCode')!.value?.trim();
    if (!code) {
      this.promoRule.set(null);
      this.discountAmount.set(0);
      this.promoMessage.set({ type: 'error', text: 'Veuillez saisir un code.' });
      return;
    }

    const rule = this.discounts.find(code);
    if (!rule) {
      this.promoRule.set(null);
      this.discountAmount.set(0);
      this.promoMessage.set({ type: 'error', text: 'Code invalide ou expiré.' });
      return;
    }

    const { amount, reason } = this.discounts.computeAmount(rule);
    if (reason) {
      this.promoRule.set(null);
      this.discountAmount.set(0);
      this.promoMessage.set({ type: 'error', text: reason });
      return;
    }

    this.promoRule.set(rule);
    this.discountAmount.set(amount);

    const saved = amount > 0 ? `Vous économisez ${this.cart.formatPrice(amount)}` : '';
    const shippingFree = rule.type === 'shipping_free' ? 'Livraison offerte.' : '';
    const msg = [`Code appliqué : ${rule.label}.`, saved, shippingFree].filter(Boolean).join(' ');
    this.promoMessage.set({ type: 'success', text: msg || `Code appliqué : ${rule.label}.` });
  }

  clearPromo() {
    this.promoRule.set(null);
    this.discountAmount.set(0);
    this.promoMessage.set(null);
  }

  effectiveShippingCost(): number {
    const rule = this.promoRule();
    if (rule?.type === 'shipping_free') return 0;
    return this.shippingCost();
  }

  totalWithShipping(): number {
    const base = this.cart.total();
    const shipping = this.effectiveShippingCost();
    const discount = this.discountAmount();
    return Math.max(0, base + shipping - discount);
  }

  /* ===== Pays ===== */
  private buildCountries(): CountryOpt[] {
    try {
      isoCountries.registerLocale(frLocale as unknown as LocaleData);
      const names = isoCountries.getNames('fr', { select: 'official' }) as Record<string, string>;
      const list = Object.entries(names)
        .filter(([code]) => /^[A-Z]{2}$/.test(code))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      const i = list.findIndex((x) => x.code === 'FR');
      if (i > 0) {
        const [fr] = list.splice(i, 1);
        list.unshift(fr);
      }
      return list;
    } catch {
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

  flagClass(code: string): string {
    return `fi fi-${code.toLowerCase()}`;
  }

  /* ===== Submit ===== */
  async submit() {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.form.markAllAsTouched();

    // VALIDATION CRITIQUE : Vérifier si le formulaire est valide
    if (this.form.invalid) {
      console.warn('Formulaire invalide, soumission bloquée');
      // Optionnel : afficher un message d'erreur global
      this.promoMessage.set({
        type: 'error',
        text: 'Veuillez corriger les erreurs dans le formulaire avant de continuer.',
      });
      return; // STOPPER ICI si le formulaire est invalide
    }

    // Vérifier que l'adresse est complète pour l'expédition
    if (!this.addressComplete()) {
      this.promoMessage.set({
        type: 'error',
        text: 'Veuillez compléter votre adresse de livraison.',
      });
      return;
    }

    // Vérifier qu'un panier n'est pas vide
    if (this.cart.empty()) {
      this.promoMessage.set({
        type: 'error',
        text: 'Votre panier est vide.',
      });
      return;
    }

    this.loading.set(true);

    try {
      const v = this.form.getRawValue();
      console.warn('Données du formulaire validées:', v);

      // déduire last4 si carte
      let last4 = v.last4 || undefined;
      if (v.method === 'card' && !last4 && v.cardNumber) {
        const digits = v.cardNumber.replace(/\D/g, '');
        if (digits.length >= 4) last4 = digits.slice(-4);
      }

      const order = await this.orders.placeOrder(
        {
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone || undefined,
          address: {
            street: [v.street, v.street2].filter(Boolean).join(' '),
            city: v.city,
            zip: v.zip,
            country: v.country,
          },
        },
        { method: v.method, last4 },
        this.effectiveShippingCost()
      );

      // Nettoyer le message promo en cas de succès
      this.promoMessage.set(null);

      this.router.navigate(['/cart/confirmation', order.id]);
    } catch (e) {
      console.error('Erreur lors de la soumission:', e);
      this.promoMessage.set({
        type: 'error',
        text: 'Une erreur est survenue lors de la validation de votre commande. Veuillez réessayer.',
      });
    } finally {
      this.loading.set(false);
    }
  }
}
