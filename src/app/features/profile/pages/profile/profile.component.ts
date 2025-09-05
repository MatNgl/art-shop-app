import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { NgSelectModule } from '@ng-select/ng-select';

// ⚠️ Assure-toi d'avoir installé :
// npm i @ng-select/ng-select i18n-iso-countries flag-icons

import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

interface CountryOpt {
  code: string;
  name: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgSelectModule],
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
              <p id="firstName-error" class="err">Le prénom est requis.</p>
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
              <p id="lastName-error" class="err">Le nom est requis.</p>
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
              <input id="phone" class="input" formControlName="phone" autocomplete="tel" />
            </div>
          </div>
        </section>

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
              <p id="city-error" class="err">La ville est requise.</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="postalCode">Code postal</label>
              <input
                id="postalCode"
                class="input"
                formControlName="postalCode"
                autocomplete="postal-code"
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
              <p id="postal-error" class="err">Code postal invalide.</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1" for="country">Pays</label>

              <!-- ng-select pays avec noms FR + drapeaux -->
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
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  user = computed(() => this.auth.currentUser$());
  saving = signal(false);
  saved = signal(false);

  countries = signal<CountryOpt[]>(this.buildCountries());

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],

    street: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\- ]{3,10}$/)]],
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
        street: u.address?.street ?? '',
        city: u.address?.city ?? '',
        postalCode: u.address?.postalCode ?? '',
        country: u.address?.country ?? 'FR',
      });
    }
  }

  /** Construit la liste FR des pays à partir d'i18n-iso-countries. */
  private buildCountries(): CountryOpt[] {
    try {
      isoCountries.registerLocale(frLocale as LocaleData);
      const names = isoCountries.getNames('fr', { select: 'official' }) as Record<string, string>;
      const list = Object.entries(names)
        .filter(([code]) => /^[A-Z]{2}$/.test(code))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

      // Optionnel : mettre la France en premier
      const idxFr = list.findIndex((x) => x.code === 'FR');
      if (idxFr > 0) {
        const fr = list.splice(idxFr, 1)[0];
        list.unshift(fr);
      }
      return list;
    } catch {
      // Fallback minimal
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

  reset() {
    const u = this.user();
    if (!u) return;
    this.form.reset({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      street: u.address?.street ?? '',
      city: u.address?.city ?? '',
      postalCode: u.address?.postalCode ?? '',
      country: u.address?.country ?? 'FR',
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
          country: v.country, // code ISO-2
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
