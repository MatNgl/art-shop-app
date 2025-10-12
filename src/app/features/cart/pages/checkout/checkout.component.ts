import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
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

// Stores profil
import { AddressesStore, Address } from '../../../profile/services/addresses-store';
import {
  PaymentsStore,
  PaymentMethod,
  PaymentBrand,
} from '../../../profile/services/payments-store';

import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

// Coupons
import { DiscountService, DiscountRule } from '../../../../shared/services/discount.service';

// Promotions
import { CartPromotionEngine } from '../../../promotions/services/cart-promotion-engine.service';
import { CartPromotionResult } from '../../../promotions/models/promotion.model';
import { CartPromotionDisplayComponent } from '../../../promotions/components/cart-promotion-display.component';

// Téléphone
import { FrPhoneMaskDirective } from '../../../../shared/directives/fr-phone-mask.directive';
import { ToastService } from '../../../../shared/services/toast.service';
import { EmailService } from '../../../../shared/services/email.service';

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
    CartPromotionDisplayComponent,
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

            <!-- Adresses existantes -->
            <div *ngIf="savedAddresses().length > 0" class="mb-4">
              <h3 class="text-sm font-medium mb-2">Adresses enregistrées</h3>
              <div class="space-y-2">
                <label
                  *ngFor="let addr of savedAddresses()"
                  class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  [class.border-blue-500]="selectedAddressId() === addr.id!"
                  [class.bg-blue-50]="selectedAddressId() === addr.id!"
                >
                  <input
                    type="radio"
                    [value]="addr.id!"
                    [checked]="selectedAddressId() === addr.id!"
                    (change)="onAddressSelected(addr)"
                    name="addressChoice"
                  />

                  <div class="flex-1">
                    <div class="text-sm font-medium">
                      {{ addr.label || 'Adresse' }}
                      <span
                        *ngIf="addr.isDefault"
                        class="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                      >
                        Par défaut
                      </span>
                    </div>
                    <div class="text-sm text-gray-600">
                      {{ addr.street }}<br />
                      {{ addr.postalCode }} {{ addr.city }}, {{ addr.country }}
                    </div>
                  </div>
                </label>
                <button
                  type="button"
                  class="text-sm text-blue-600 hover:text-blue-700"
                  (click)="useNewAddress()"
                  *ngIf="selectedAddressId() !== 'new'"
                >
                  + Utiliser une nouvelle adresse
                </button>
              </div>
            </div>

            <!-- Formulaire nouvelle adresse -->
            <div
              *ngIf="selectedAddressId() === 'new' || savedAddresses().length === 0"
              class="space-y-4"
            >
              <div *ngIf="savedAddresses().length > 0">
                <button
                  type="button"
                  class="text-sm text-gray-600 hover:text-gray-700 mb-3"
                  (click)="selectDefaultAddress()"
                >
                  ← Utiliser une adresse existante
                </button>
              </div>

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
                  <p
                    class="err"
                    *ngIf="form.get('country')?.invalid && form.get('country')?.touched"
                  >
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
                    [class.invalid]="
                      form.get('firstName')?.invalid && form.get('firstName')?.touched
                    "
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
                    La ville est requise (minimum 2 caractères).
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

                <p class="err" *ngIf="form.get('phone')?.invalid && form.get('phone')?.touched">
                  Format de téléphone français invalide.
                </p>
              </div>

              <label class="checkbox" *ngIf="selectedAddressId() === 'new'">
                <input type="checkbox" formControlName="saveAddress" />
                <span>Sauvegarder cette adresse pour les prochaines commandes</span>
              </label>
            </div>
          </section>

          <!-- Mode d'expédition -->
          <section class="section">
            <h2>Mode d'expédition</h2>
            <div class="ship card" [class.muted]="!addressComplete()">
              <p *ngIf="!addressComplete()" class="muted-text">
                Sélectionnez une adresse d'expédition pour voir les modes d'expédition disponibles.
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

          <!-- Paiement -->
          <section class="section">
            <h2>Paiement</h2>
            <p class="sub">Toutes les transactions sont sécurisées et chiffrées.</p>

            <!-- Cartes existantes -->
            <div *ngIf="savedPayments().length > 0" class="mb-4">
              <h3 class="text-sm font-medium mb-2">Cartes enregistrées</h3>

              <div class="space-y-2">
                <label
                  *ngFor="let card of savedPayments()"
                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  [class.border-blue-500]="selectedPaymentId() === card.id"
                  [class.bg-blue-50]="selectedPaymentId() === card.id"
                >
                  <input
                    type="radio"
                    [value]="card.id"
                    [checked]="selectedPaymentId() === card.id"
                    (change)="onPaymentSelected(card)"
                    name="paymentChoice"
                  />
                  <i [class]="getCardIcon(card.brand)" class="text-2xl"></i>

                  <div class="flex-1">
                    <div class="text-sm font-semibold truncate" *ngIf="card.label; else brandLast4">
                      {{ card.label }}
                      <span
                        *ngIf="card.isDefault"
                        class="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                      >
                        Par défaut
                      </span>
                    </div>
                    <ng-template #brandLast4>
                      <div class="text-sm font-semibold truncate">
                        {{ card.brand | uppercase }} •••• {{ card.last4 }}
                        <span
                          *ngIf="card.isDefault"
                          class="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                        >
                          Par défaut
                        </span>
                      </div>
                    </ng-template>

                    <div class="text-sm text-gray-600 truncate">
                      {{ card.brand | uppercase }} •••• {{ card.last4 }} • Exp
                      {{ formatMonth(card.expMonth) }}/{{ card.expYear }}
                      <span *ngIf="card.holder">• {{ card.holder }}</span>
                    </div>
                  </div>
                </label>

                <button
                  type="button"
                  class="text-sm text-blue-600 hover:text-blue-700"
                  (click)="useNewPayment()"
                  *ngIf="selectedPaymentId() !== 'new'"
                >
                  + Utiliser une nouvelle carte
                </button>
              </div>
            </div>

            <!-- Formulaire nouvelle carte -->
            <div
              *ngIf="selectedPaymentId() === 'new' || savedPayments().length === 0"
              class="card card-credit"
            >
              <div *ngIf="savedPayments().length > 0">
                <button
                  type="button"
                  class="text-sm text-gray-600 hover:text-gray-700 mb-3"
                  (click)="selectDefaultPayment()"
                >
                  ← Utiliser une carte existante
                </button>
              </div>

              <div class="field">
                <span>Type de carte *</span>
                <div class="flex gap-3">
                  <label class="flex items-center gap-2" *ngFor="let b of brands">
                    <input
                      type="radio"
                      [value]="b"
                      formControlName="brand"
                      [checked]="form.value.brand === b"
                    />
                    <i [class]="getCardIcon(b)"></i>
                    <span class="capitalize">{{ b }}</span>
                  </label>
                </div>
              </div>

              <div class="field">
                <label for="cardLabel">Nom (alias) (optionnel)</label>
                <input
                  id="cardLabel"
                  class="input"
                  formControlName="cardLabel"
                  maxlength="40"
                  placeholder="ex. Carte pro"
                />
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
                  Numéro de carte invalide (12 chiffres requis).
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
                  Le nom sur la carte est requis (minimum 2 caractères).
                </p>
              </div>

              <label class="checkbox" *ngIf="selectedPaymentId() === 'new'">
                <input type="checkbox" formControlName="savePayment" />
                <span>Sauvegarder cette carte pour les prochaines commandes</span>
              </label>

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
            <button type="button" class="btn-primary" (click)="applyPromo()">Valider</button>
          </div>

          <div
            *ngIf="promoMessage()"
            class="alert"
            [class.alert-success]="promoMessage()?.type === 'success'"
            [class.alert-error]="promoMessage()?.type === 'error'"
          >
            {{ promoMessage()?.text }}
          </div>

          <!-- Promotions actives -->
          @if (cartPromotions() && cartPromotions()!.appliedPromotions.length > 0) {
          <div class="mb-4">
            <app-cart-promotion-display [promotionResult]="cartPromotions()" />
          </div>
          }

          <ul class="items">
            @for (it of cart.items(); track it.productId + '_' + (it.variantId ?? '')) {
            <li class="item">
              <img class="thumb" [src]="productImage(it)" [alt]="it.title" loading="lazy" />
              <div class="meta">
                <span class="title">
                  {{ it.title }}
                  @if (it.variantLabel) {
                  <span class="text-xs text-gray-500">({{ it.variantLabel }})</span>
                  } × {{ it.qty }}
                </span>
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

            <div class="row" *ngIf="automaticDiscountAmount() > 0">
              <span>Promotions automatiques</span>
              <span>-{{ automaticDiscountAmount() | price }}</span>
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
                <ng-container *ngIf="promoRule()?.type === 'shipping_free'">(offerte)</ng-container>
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
export class CheckoutComponent implements OnInit {
  cart = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly discounts = inject(DiscountService);
  private readonly toast = inject(ToastService);
  private readonly promotionEngine = inject(CartPromotionEngine);
  private readonly emailService = inject(EmailService);

  // Stores profil
  private readonly addressesStore = inject(AddressesStore);
  private readonly paymentsStore = inject(PaymentsStore);

  readonly brands: PaymentBrand[] = ['visa', 'mastercard', 'amex', 'paypal', 'other'];

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
  automaticDiscountAmount = signal<number>(0);

  // cart promotions
  cartPromotions = signal<CartPromotionResult | null>(null);

  countries = signal<CountryOpt[]>(this.buildCountries());

  // Adresses & paiements
  savedAddresses = computed(() => this.addressesStore.items());
  savedPayments = computed(() => this.paymentsStore.items());
  selectedAddressId = signal<string>('');
  selectedPaymentId = signal<string>('');

  // Validators (inchangés)
  private frPhoneValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return null;
    const digits = String(value).replace(/\D/g, '');
    const normalized =
      digits.startsWith('33') && digits.length >= 11 ? '0' + digits.slice(2) : digits;
    return normalized.length === 10 && normalized.startsWith('0') ? null : { phoneFr: true };
  };
  private noDigitsValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = (ctrl.value ?? '').toString();
    if (!value.trim()) return null;
    return /\d/.test(value) ? { noDigits: true } : null;
  };
  private cardNumberValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 16 ? null : { cardNumber: true };
  };
  private cardExpiryValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };
    const v = String(value).trim();
    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    const slashPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    return monthPattern.test(v) || slashPattern.test(v) ? null : { cardExpiry: true };
  };
  private cardCvcValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;
    if (!value || !value.trim()) return { required: true };
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 3 ? null : { cardCvc: true };
  };

  // Form
  form = this.fb.nonNullable.group({
    // contact
    email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
    newsletter: [true],
    // livraison
    country: ['FR', [Validators.required]],
    firstName: ['', [Validators.required, Validators.minLength(2), this.noDigitsValidator]],
    lastName: ['', [Validators.required, Validators.minLength(2), this.noDigitsValidator]],
    company: [''],
    street: ['', [Validators.required]],
    street2: [''],
    zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    city: ['', [Validators.required, Validators.minLength(2), this.noDigitsValidator]],
    phone: ['', [this.frPhoneValidator]],
    saveAddress: [false],
    // paiement
    method: this.fb.nonNullable.control<'card' | 'paypal' | 'bank'>('card'),
    brand: this.fb.nonNullable.control<PaymentBrand>('visa'),
    last4: [''],
    cardNumber: ['', [this.cardNumberValidator]],
    cardExpiry: ['', [this.cardExpiryValidator]],
    cardCvc: ['', [this.cardCvcValidator]],
    cardName: ['', [Validators.required, Validators.minLength(2), this.noDigitsValidator]],
    cardLabel: [''],
    savePayment: [false],
    billingSameAsShipping: [true],
  });

  promoForm: FormGroup = this.fb.nonNullable.group({
    promoCode: [''],
  });

  ngOnInit() {
    this.initializeUserData();
    this.initializeDefaultSelections();
    void this.applyAutomaticPromotions();
    void this.calculateCartPromotions();
  }

  private async calculateCartPromotions(): Promise<void> {
    const items = this.cart.items();
    const subtotal = this.cart.subtotal();
    const result = await this.promotionEngine.calculateCartPromotions(items, subtotal);
    this.cartPromotions.set(result);
  }

  private initializeUserData() {
    const user = this.auth.currentUser$();
    if (user) {
      this.form.patchValue({
        email: user.email ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
      });

      const defaultAddr = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
      if (defaultAddr) {
        this.form.patchValue({
          street: defaultAddr.street ?? '',
          city: defaultAddr.city ?? '',
          zip: defaultAddr.postalCode ?? '',
          country: (defaultAddr.country as string) ?? 'FR',
        });
      }
    }
  }

  private initializeDefaultSelections() {
    const defAddr =
      this.savedAddresses().find((a) => a.isDefault && !!a.id) ?? this.savedAddresses()[0];
    if (defAddr?.id) {
      this.selectedAddressId.set(defAddr.id);
      this.onAddressSelected(defAddr);
    } else if (this.savedAddresses().length === 0) {
      this.selectedAddressId.set('new');
    }

    const defPay = this.savedPayments().find((p) => p.isDefault) ?? this.savedPayments()[0];
    if (defPay?.id) {
      this.selectedPaymentId.set(defPay.id);
      this.onPaymentSelected(defPay);
    } else if (this.savedPayments().length === 0) {
      this.selectedPaymentId.set('new');
    }
  }

  // Sélections (inchangées)
  onAddressSelected(addr: Address) {
    this.selectedAddressId.set(addr.id ?? '');
    this.form.patchValue({
      firstName: this.form.value.firstName || '',
      lastName: this.form.value.lastName || '',
      street: addr.street,
      city: addr.city,
      zip: this.extractPostalCode(addr),
      country: this.getCountryCode(addr.country),
    });
  }

  onPaymentSelected(payment: PaymentMethod) {
    this.selectedPaymentId.set(payment.id);
    this.form.patchValue({
      brand: payment.brand,
      last4: payment.last4,
      cardName: payment.holder || '',
    });
    this.form.get('cardNumber')?.disable();
    this.form.get('cardExpiry')?.disable();
    this.form.get('cardCvc')?.disable();
  }

  useNewAddress() {
    this.selectedAddressId.set('new');
    this.clearAddressForm();
  }

  useNewPayment() {
    this.selectedPaymentId.set('new');
    this.clearPaymentForm();
    this.form.get('cardNumber')?.enable();
    this.form.get('cardExpiry')?.enable();
    this.form.get('cardCvc')?.enable();
  }

  selectDefaultAddress() {
    const def =
      this.savedAddresses().find((a) => a.isDefault && !!a.id) ?? this.savedAddresses()[0];
    if (def?.id) {
      this.selectedAddressId.set(def.id);
      this.onAddressSelected(def);
    }
  }

  selectDefaultPayment() {
    const def = this.savedPayments().find((p) => p.isDefault) ?? this.savedPayments()[0];
    if (def?.id) {
      this.selectedPaymentId.set(def.id);
      this.onPaymentSelected(def);
    }
  }

  // Helpers UI (inchangés)
  private clearAddressForm() {
    this.form.patchValue({
      firstName: '',
      lastName: '',
      company: '',
      street: '',
      street2: '',
      zip: '',
      city: '',
      phone: '',
      country: 'FR',
    });
  }

  private clearPaymentForm() {
    this.form.patchValue({
      last4: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      cardName: '',
    });
  }

  private extractPostalCode(addr: Address): string {
    if (typeof addr.postalCode === 'string') return addr.postalCode;
    const addrZip = (addr as unknown as { zip?: string }).zip;
    if (typeof addrZip === 'string') return addrZip;
    return '';
  }

  getCardIcon(brand: PaymentBrand): string {
    switch (brand) {
      case 'visa':
        return 'fa-brands fa-cc-visa text-blue-600';
      case 'mastercard':
        return 'fa-brands fa-cc-mastercard text-red-600';
      case 'amex':
        return 'fa-brands fa-cc-amex text-indigo-600';
      default:
        return 'fa-solid fa-credit-card text-gray-500';
    }
  }

  formatMonth(m: number): string {
    return m < 10 ? `0${m}` : `${m}`;
  }

  private getCountryCode(countryName: string): string {
    const byName = this.countries().find((c) => c.name === countryName);
    return byName ? byName.code : countryName?.length === 2 ? countryName : 'FR';
  }

  flagClass(code: string): string {
    return `fi fi-${code.toLowerCase()}`;
  }

  // Submit
  async submit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.promoMessage.set({
        type: 'error',
        text: 'Veuillez corriger les erreurs dans le formulaire avant de continuer.',
      });
      return;
    }

    if (this.cart.empty()) {
      this.promoMessage.set({ type: 'error', text: 'Votre panier est vide.' });
      return;
    }

    this.loading.set(true);

    try {
      const v = this.form.getRawValue();

      // Adresse/paiement sauvegardés si "new" (inchangé) …
      if (this.selectedAddressId() === 'new') {
        const newAddress: Address = {
          id: crypto.randomUUID(),
          street: [v.street, v.street2].filter(Boolean).join(' '),
          city: v.city,
          postalCode: v.zip,
          country: v.country,
          isDefault: false,
        };
        if (v.saveAddress) {
          this.addressesStore.add(newAddress);
        }
        this.selectedAddressId.set(newAddress.id!);
      }

      if (this.selectedPaymentId() === 'new') {
        const digits = (v.cardNumber ?? '').replace(/\D/g, '');
        const chosenBrand: PaymentBrand = (v.brand as PaymentBrand) || this.detectBrand(digits);
        const last4 = digits.slice(-4);
        const safeLabel =
          (v.cardLabel ?? '').toString().trim() || `${chosenBrand.toUpperCase()} •••• ${last4}`;

        const newPayment: PaymentMethod = {
          id: crypto.randomUUID(),
          label: safeLabel,
          brand: chosenBrand,
          last4,
          expMonth: parseInt(String(v.cardExpiry).split('-')[1] ?? '1', 10),
          expYear: parseInt(String(v.cardExpiry).split('-')[0] ?? '1970', 10),
          holder: v.cardName?.toString().trim(),
          isDefault: false,
        };
        this.paymentsStore.add(newPayment);
      }
      const selectedPayment = this.savedPayments().find((p) => p.id === this.selectedPaymentId());

      const selectedLast4 =
        this.savedPayments().find((p) => p.id === this.selectedPaymentId())?.last4 ??
        v.last4 ??
        ((v.cardNumber ?? '').replace(/\D/g, '').slice(-4) || undefined);

      const selectedBrand: PaymentBrand | undefined =
        selectedPayment?.brand ??
        v.brand ??
        this.detectBrand((v.cardNumber ?? '').replace(/\D/g, ''));

      // Création de commande (en 'pending')
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
        {
          method: v.method,
          last4: selectedLast4,
          brand: selectedBrand,
        },
        this.effectiveShippingCost()
      );

      // 👉 Déclenche le débit du stock immédiatement : pending -> processing
      await this.orders.updateStatus(order.id, 'processing');

      // 📧 Envoi de l'email de confirmation
      try {
        await this.emailService.sendOrderConfirmationEmail(order);
        console.warn('✅ Email de confirmation envoyé avec succès');
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
        // On ne bloque pas la commande si l'email échoue
      }

      this.promoMessage.set(null);
      this.toast.success('Commande validée ! Un email de confirmation vous a été envoyé.');
      this.router.navigate(['/cart/confirmation', order.id]);
    } catch (e) {
      console.error('Erreur lors de la commande', e);
      this.promoMessage.set({
        type: 'error',
        text: 'Une erreur est survenue, veuillez réessayer.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private detectBrand(cardNumber: string): PaymentBrand {
    if (/^4/.test(cardNumber)) return 'visa';
    if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
    if (/^3[47]/.test(cardNumber)) return 'amex';
    return 'other';
  }

  // Helpers (inchangés)
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
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  productImage(it: { productId: string | number; imageUrl?: string }): string {
    return it.imageUrl ?? `/assets/products/${it.productId}.jpg`;
  }

  addressComplete(): boolean {
    const v = this.form.getRawValue();
    return !!(v.street && v.zip && v.city && v.country);
  }

  setShipping(type: 'standard' | 'express') {
    this.shipping.set(type);
    this.shippingCost.set(type === 'express' ? this.expressPrice : this.standardPrice);
  }

  async applyPromo() {
    const code = this.promoForm.get('promoCode')!.value?.trim();
    if (!code) {
      this.promoRule.set(null);
      this.discountAmount.set(0);
      this.promoMessage.set({ type: 'error', text: 'Veuillez saisir un code.' });
      return;
    }

    const rule = await this.discounts.find(code);
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

  async applyAutomaticPromotions(): Promise<void> {
    try {
      const result = await this.discounts.calculateCartPromotions();
      this.automaticDiscountAmount.set(result.totalDiscount);
    } catch (error) {
      console.error("Erreur lors de l'application des promotions automatiques:", error);
      this.automaticDiscountAmount.set(0);
    }
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
    const automaticDiscount = this.automaticDiscountAmount();
    return Math.max(0, base + shipping - discount - automaticDiscount);
  }

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
}
