import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

interface CountryOpt { code: string; name: string; }

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
          <!-- Contact -->
          <section class="section">
            <h2>Contact</h2>
            <div class="field">
              <label for="email">Adresse e-mail</label>
              <input id="email" class="input" type="email" formControlName="email" [readOnly]="true" />
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
                <label for="country">Pays/région</label>
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

            <div class="grid-2">
              <div class="field">
                <label for="firstName">Prénom</label>
                <input id="firstName" class="input" formControlName="firstName" />
                <p class="err" *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched">
                  Le prénom ne doit contenir que des lettres (accents/espaces/traits d’union autorisés).
                </p>
              </div>
              <div class="field">
                <label for="lastName">Nom</label>
                <input id="lastName" class="input" formControlName="lastName" />
                <p class="err" *ngIf="form.get('lastName')?.invalid && form.get('lastName')?.touched">
                  Le nom ne doit contenir que des lettres (accents/espaces/traits d’union autorisés).
                </p>
              </div>
            </div>

            <div class="field">
              <label for="company">Entreprise (optionnel)</label>
              <input id="company" class="input" formControlName="company" />
            </div>

            <div class="field">
              <label for="street">Adresse</label>
              <input id="street" class="input" formControlName="street" placeholder="Numéro et rue" />
            </div>

            <div class="field">
              <label for="street2">Appartement, suite, etc. (optionnel)</label>
              <input id="street2" class="input" formControlName="street2" />
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="zip">Code postal</label>
                <input
                  id="zip"
                  class="input"
                  formControlName="zip"
                  inputmode="numeric"
                  pattern="\\d*"
                  maxlength="5"
                  (input)="digitsOnly('zip', 5)"
                />
                <p class="err" *ngIf="form.get('zip')?.invalid && form.get('zip')?.touched">
                  Code postal français à 5 chiffres.
                </p>
              </div>
              <div class="field">
                <label for="city">Ville</label>
                <input id="city" class="input" formControlName="city" />
                <p class="err" *ngIf="form.get('city')?.invalid && form.get('city')?.touched">
                  La ville ne doit contenir que des lettres (accents/espaces/traits d’union autorisés).
                </p>
              </div>
            </div>

            <div class="field">
              <label for="phone">Téléphone</label>
              <input id="phone" class="input" formControlName="phone" placeholder="06 11 22 33 44" appFrPhoneMask />
              <p class="hint" *ngIf="form.value.phone">
                Formaté : {{ form.value.phone | frPhone }}
              </p>
              <p class="err" *ngIf="form.get('phone')?.invalid && form.get('phone')?.touched">
                Numéro FR attendu (10 chiffres).
              </p>
            </div>

            <label class="checkbox">
              <input type="checkbox" formControlName="remember" />
              <span>Sauvegarder mes coordonnées pour la prochaine fois</span>
            </label>
          </section>

          <!-- Mode d’expédition -->
          <section class="section">
            <h2>Mode d’expédition</h2>
            <div class="ship card" [class.muted]="!addressComplete()">
              <p *ngIf="!addressComplete()" class="muted-text">
                Saisissez votre adresse d’expédition pour voir les modes d’expédition disponibles.
              </p>

              <div *ngIf="addressComplete()" class="ship-options">
                <label class="radio">
                  <input type="radio" name="shipping" [checked]="shipping() === 'standard'" (change)="setShipping('standard')" />
                  <span>Standard (3–5 j) — {{ standardPrice | price }}</span>
                </label>
                <label class="radio">
                  <input type="radio" name="shipping" [checked]="shipping() === 'express'" (change)="setShipping('express')" />
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
                <label for="cardNumber">Numéro de carte</label>
                <input
                  id="cardNumber"
                  class="input"
                  formControlName="cardNumber"
                  inputmode="numeric"
                  pattern="\\d*"
                  maxlength="19"
                  placeholder="1234 5678 9012 3456"
                  (keydown)="handleCardBackspace($event)"
                  (input)="formatCardNumber($event, 'cardNumber', 16)"
                />
              </div>

              <div class="grid-2">
                <div class="field">
                  <label for="cardExpiry">Date d’expiration</label>
                  <input
                    id="cardExpiry"
                    class="input"
                    type="month"
                    formControlName="cardExpiry"
                  />
                  <p class="hint">Sélectionnez mois/année (ex: 2027-04).</p>
                </div>
                <div class="field">
                  <label for="cardCvc">Code de sécurité</label>
                  <input
                    id="cardCvc"
                    class="input"
                    formControlName="cardCvc"
                    inputmode="numeric"
                    pattern="\\d*"
                    maxlength="3"
                    placeholder="CVC"
                    (input)="digitsOnly('cardCvc', 3)"
                  />
                </div>
              </div>

              <div class="field">
                <label for="cardName">Nom sur la carte</label>
                <input id="cardName" class="input" formControlName="cardName" placeholder="Comme indiqué sur la carte" />
              </div>

              <label class="checkbox">
                <input type="checkbox" formControlName="billingSameAsShipping" />
                <span>Utiliser l’adresse d’expédition comme adresse de facturation</span>
              </label>
            </div>
          </section>

          <button class="btn-primary" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Traitement...' : 'Vérifier la commande' }}
          </button>
        </form>

        <!-- Colonne récap (sticky) -->
        <aside class="card summary sticky">
          <div class="discount">
            <input class="input" placeholder="Code de réduction ou carte-cadeau" formControlName="promoCode" />
            <button type="button" class="btn-secondary" (click)="applyPromo()">Valider</button>
          </div>

          <!-- Message succès/erreur -->
          <div *ngIf="promoMessage()" class="alert"
               [class.alert-success]="promoMessage()?.type === 'success'"
               [class.alert-error]="promoMessage()?.type === 'error'">
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
              <span>Réduction<span *ngIf="promoRule()?.code">&nbsp;({{ promoRule()?.code }})</span></span>
              <span>-{{ discountAmount() | price }}</span>
            </div>

            <div class="row">
              <span>Expédition</span>
              <span>
                {{ effectiveShippingCost() | price }}
                <ng-container *ngIf="promoRule()?.type === 'shipping_free'"> (offerte)</ng-container>
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

  // coupons
  promoRule = signal<DiscountRule | null>(null);
  promoMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  discountAmount = signal<number>(0);

  countries = signal<CountryOpt[]>(this.buildCountries());

  private readonly alphaFr = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  private readonly cityFr = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  /* ===== Validators ===== */
  private frPhoneValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const digits = String(ctrl.value ?? '').replace(/\D/g, '');
    if (!digits) return null; // optionnel
    const normalized = digits.startsWith('33') && digits.length >= 11 ? '0' + digits.slice(2) : digits;
    return normalized.length === 10 && normalized.startsWith('0') ? null : { phoneFr: true };
  };

  private cardNumberValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const digits = String(ctrl.value ?? '').replace(/\D/g, '');
    if (!digits) return null;
    return /^\d{16}$/.test(digits) ? null : { cardNumber: true };
  };

  /** Accepte 'YYYY-MM' (input type month) ou 'MM/AA'. */
  private cardExpiryValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const v = String(ctrl.value ?? '').trim();
    if (!v) return null;
    const okMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
    const okSlash = /^(0[1-9]|1[0-2])\/\d{2}$/.test(v);
    return okMonth || okSlash ? null : { cardExpiry: true };
  };

  private cardCvcValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const digits = String(ctrl.value ?? '').replace(/\D/g, '');
    if (!digits) return null;
    return /^\d{3}$/.test(digits) ? null : { cardCvc: true };
  };

  form = this.fb.nonNullable.group({
    // contact
    email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
    newsletter: [true],
    // livraison
    country: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(this.alphaFr)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(this.alphaFr)]],
    company: [''],
    street: ['', Validators.required],
    street2: [''],
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    city: ['', [Validators.required, Validators.pattern(this.cityFr)]],
    phone: ['', [this.frPhoneValidator]],

    remember: [false],

    // paiement (simulation)
    method: this.fb.nonNullable.control<'card' | 'paypal' | 'bank'>('card'),
    last4: [''],
    cardNumber: ['', [this.cardNumberValidator]],
    cardExpiry: ['', [this.cardExpiryValidator]],
    cardCvc: ['', [this.cardCvcValidator]],
    cardName: ['', [Validators.required, Validators.pattern(this.alphaFr)]],

    // recap
    promoCode: [''],
    billingSameAsShipping: [true],
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

  /* ===== Helpers ===== */

  digitsOnly(controlName: 'zip' | 'cardCvc', max: number) {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;
    const digits = String(ctrl.value ?? '').replace(/\D/g, '').slice(0, max);
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

    let newPos = 0, seenDigits = 0;
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
    const code = this.form.get('promoCode')!.value?.trim();
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
      if (i > 0) { const [fr] = list.splice(i, 1); list.unshift(fr); }
      return list;
    } catch {
      return [
        { code: 'FR', name: 'France' }, { code: 'BE', name: 'Belgique' }, { code: 'CH', name: 'Suisse' },
        { code: 'DE', name: 'Allemagne' }, { code: 'IT', name: 'Italie' }, { code: 'ES', name: 'Espagne' },
        { code: 'PT', name: 'Portugal' }, { code: 'GB', name: 'Royaume-Uni' }, { code: 'US', name: 'États-Unis' },
        { code: 'CA', name: 'Canada' }, { code: 'ZA', name: 'Afrique du Sud' },
      ];
    }
  }
  flagClass(code: string): string { return `fi fi-${code.toLowerCase()}`; }

  /* ===== Submit ===== */
  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const v = this.form.getRawValue();

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
          address: { street: [v.street, v.street2].filter(Boolean).join(' '), city: v.city, zip: v.zip, country: v.country },
        },
        { method: v.method, last4 },
        this.effectiveShippingCost()
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
