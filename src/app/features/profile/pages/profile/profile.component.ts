import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Address } from '../../../auth/models/user.model';

import { AuthService } from '../../../auth/services/auth';
import { NgSelectModule } from '@ng-select/ng-select';

import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

// Téléphone (masque + pipe, comme dans checkout)
import { FrPhoneMaskDirective } from '../../../../shared/directives/fr-phone-mask.directive';
import { FrPhonePipe } from '../../../../shared/pipes/fr-phone.pipe';

interface CountryOpt {
  code: string;
  name: string;
}

type AddressWithDefault = Address & { isDefault?: boolean };

function getPrimaryAddress(u?: { addresses?: AddressWithDefault[] }) {
  const list = (u?.addresses ?? []) as AddressWithDefault[];
  return list.find(a => a.isDefault) ?? list[0];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgSelectModule,
    FrPhoneMaskDirective,
    FrPhonePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Mon profil</h1>

      @if (!user()) {
      <div class="bg-white rounded-xl shadow p-6">
        <p class="text-gray-700">Vous devez être connecté pour accéder à cette page.</p>
        <a class="text-blue-600 underline" routerLink="/auth/login">Se connecter</a>
      </div>
      } @else {
      <form
        class="bg-white rounded-2xl shadow p-6 space-y-6"
        [formGroup]="form"
        (ngSubmit)="save()"
      >
        <!-- Informations -->
        <section>
          <h2 class="font-semibold mb-4">Informations</h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1" for="firstName">Prénom</label>
              <input
                id="firstName"
                class="input"
                formControlName="firstName"
                autocomplete="given-name"
                [attr.aria-invalid]="
                  form.controls.firstName.touched && form.controls.firstName.invalid
                "
                [attr.aria-describedby]="
                  form.controls.firstName.touched && form.controls.firstName.invalid
                    ? 'firstName-error'
                    : null
                "
              />
              @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
              <p id="firstName-error" class="err">
                Le prénom est requis (lettres, espaces et tirets).
              </p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="lastName">Nom</label>
              <input
                id="lastName"
                class="input"
                formControlName="lastName"
                autocomplete="family-name"
                [attr.aria-invalid]="
                  form.controls.lastName.touched && form.controls.lastName.invalid
                "
                [attr.aria-describedby]="
                  form.controls.lastName.touched && form.controls.lastName.invalid
                    ? 'lastName-error'
                    : null
                "
              />
              @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
              <p id="lastName-error" class="err">Le nom est requis (lettres, espaces et tirets).</p>
              }
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1" for="email">Email</label>
              <input
                id="email"
                class="input"
                formControlName="email"
                type="email"
                autocomplete="email"
                [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
                [attr.aria-describedby]="
                  form.controls.email.touched && form.controls.email.invalid ? 'email-error' : null
                "
              />
              @if (form.controls.email.touched && form.controls.email.invalid) {
              <p id="email-error" class="err">Email invalide.</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="phone"
                >Téléphone (optionnel)</label
              >
              <input
                id="phone"
                class="input"
                formControlName="phone"
                autocomplete="tel"
                appFrPhoneMask
              />
              <p class="text-xs text-gray-500 mt-1" *ngIf="form.value.phone">
                Formaté&nbsp;: {{ form.value.phone | frPhone }}
              </p>
              @if (form.controls.phone.touched && form.controls.phone.invalid) {
              <p class="err">Numéro FR attendu (10 chiffres, ex&nbsp;: 06 12 34 56 78).</p>
              }
            </div>
          </div>
        </section>

        <!-- Adresse -->
        <section>
          <h2 class="font-semibold mb-4">Adresse</h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-600 mb-1" for="street">Rue</label>
              <input
                id="street"
                class="input"
                formControlName="street"
                autocomplete="address-line1"
                [attr.aria-invalid]="form.controls.street.touched && form.controls.street.invalid"
                [attr.aria-describedby]="
                  form.controls.street.touched && form.controls.street.invalid
                    ? 'street-error'
                    : null
                "
              />
              @if (form.controls.street.touched && form.controls.street.invalid) {
              <p id="street-error" class="err">La rue est requise.</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="city">Ville</label>
              <input
                id="city"
                class="input"
                formControlName="city"
                autocomplete="address-level2"
                [attr.aria-invalid]="form.controls.city.touched && form.controls.city.invalid"
                [attr.aria-describedby]="
                  form.controls.city.touched && form.controls.city.invalid ? 'city-error' : null
                "
              />
              @if (form.controls.city.touched && form.controls.city.invalid) {
              <p id="city-error" class="err">La ville est invalide (lettres, espaces et tirets).</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="postalCode">Code postal</label>
              <input
                id="postalCode"
                class="input"
                formControlName="postalCode"
                autocomplete="postal-code"
                inputmode="numeric"
                pattern="\\d*"
                maxlength="5"
                (input)="digitsOnly('postalCode', 5)"
                [attr.aria-invalid]="
                  form.controls.postalCode.touched && form.controls.postalCode.invalid
                "
                [attr.aria-describedby]="
                  form.controls.postalCode.touched && form.controls.postalCode.invalid
                    ? 'postal-error'
                    : null
                "
              />
              @if (form.controls.postalCode.touched && form.controls.postalCode.invalid) {
              <p id="postal-error" class="err">Code postal français à 5 chiffres.</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="country">Pays</label>

              <ng-select
                id="country"
                class="ng-country"
                formControlName="country"
                [items]="countries()"
                bindLabel="name"
                bindValue="code"
                [searchable]="true"
                [clearable]="false"
                placeholder="Choisir un pays…"
                [attr.aria-invalid]="form.controls.country.touched && form.controls.country.invalid"
                [attr.aria-describedby]="
                  form.controls.country.touched && form.controls.country.invalid
                    ? 'country-error'
                    : null
                "
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

              @if (form.controls.country.touched && form.controls.country.invalid) {
              <p id="country-error" class="err">Le pays est requis.</p>
              }
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            [disabled]="form.invalid || form.pristine || saving()"
          >
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>

          <button
            type="button"
            class="px-4 py-2 rounded-md border hover:bg-gray-50"
            [disabled]="form.pristine || saving()"
            (click)="reset()"
          >
            Réinitialiser
          </button>

          @if (saved()) {
          <span class="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
            Modifications enregistrées ✔
          </span>
          }
        </div>
      </form>
      }
    </div>
  `,
  styles: [
    `
      .input {
        @apply w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600;
      }
      .err {
        @apply mt-1 text-xs text-red-600;
      }
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
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  user = computed(() => this.auth.currentUser$());
  saving = signal(false);
  saved = signal(false);

  countries = signal<CountryOpt[]>(this.buildCountries());

  // mêmes regex/validators que Checkout
  private readonly alphaFr = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  private readonly cityFr = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  private frPhoneValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const digits = String(ctrl.value ?? '').replace(/\D/g, '');
    if (!digits) return null; // optionnel
    const normalized =
      digits.startsWith('33') && digits.length >= 11 ? '0' + digits.slice(2) : digits;
    return normalized.length === 10 && normalized.startsWith('0') ? null : { phoneFr: true };
  };

  form = this.fb.nonNullable.group({
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.pattern(this.alphaFr)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.pattern(this.alphaFr)],
    ],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [this.frPhoneValidator]],

    street: ['', Validators.required],
    city: ['', [Validators.required, Validators.pattern(this.cityFr)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    country: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]], // code ISO-2
  });

  constructor() {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        street: getPrimaryAddress(u)?.street ?? '',
        city: getPrimaryAddress(u)?.city ?? '',
        postalCode: getPrimaryAddress(u)?.postalCode ?? '',
        country: getPrimaryAddress(u)?.country ?? 'FR',
      });
    }
  }

  /** Construit la liste FR des pays. */
  private buildCountries(): CountryOpt[] {
    try {
      isoCountries.registerLocale(frLocale as LocaleData);
      const names = isoCountries.getNames('fr', { select: 'official' }) as Record<string, string>;
      const list = Object.entries(names)
        .filter(([code]) => /^[A-Z]{2}$/.test(code))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      const idxFr = list.findIndex((x) => x.code === 'FR');
      if (idxFr > 0) {
        const fr = list.splice(idxFr, 1)[0];
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
        { code: 'NL', name: 'Pays-Bas' },
        { code: 'LU', name: 'Luxembourg' },
        { code: 'GB', name: 'Royaume-Uni' },
        { code: 'US', name: 'États-Unis' },
        { code: 'CA', name: 'Canada' },
      ];
    }
  }

  /** Classe CSS du drapeau pour flag-icons. */
  flagClass(code: string): string {
    return `fi fi-${code.toLowerCase()}`;
  }

  /** Utilities */
  digitsOnly(controlName: 'postalCode', max: number) {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;
    const digits = String(ctrl.value ?? '')
      .replace(/\D/g, '')
      .slice(0, max);
    ctrl.setValue(digits, { emitEvent: false });
  }

  reset() {
    const u = this.user();
    if (!u) return;
    this.form.reset({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      street: getPrimaryAddress(u)?.street ?? '',
      city: getPrimaryAddress(u)?.city ?? '',
      postalCode: getPrimaryAddress(u)?.postalCode ?? '',
      country: getPrimaryAddress(u)?.country ?? 'FR',
    });
    this.saved.set(false);
  }

  async save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    try {
      const v = this.form.getRawValue();
      await this.auth.updateProfile({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone || undefined,
        address: {
          street: v.street,
          city: v.city,
          postalCode: v.postalCode,
          country: v.country,
        },
      });
      this.form.markAsPristine();
      this.saved.set(true);
    } catch (e) {
      console.error(e);
      alert('Impossible d’enregistrer le profil.');
    } finally {
      this.saving.set(false);
    }
  }
}
