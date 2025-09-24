import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { AddressesStore, Address } from '../../services/addresses-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth';
import { DigitsOnlyDirective } from '../../../../shared/directives/digits-only.directive';
import { NgSelectModule } from '@ng-select/ng-select';

import * as isoCountries from 'i18n-iso-countries';
import type { LocaleData } from 'i18n-iso-countries';
import * as frLocale from 'i18n-iso-countries/langs/fr.json';

interface CountryOpt {
  code: string; // ISO-2
  name: string; // libellé FR
}

@Component({
  standalone: true,
  selector: 'app-profile-addresses',
  imports: [CommonModule, FormsModule, DigitsOnlyDirective, NgSelectModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1 class="page__title">Mes adresses</h1>
          <span class="page__counter">{{ count() }} / {{ max }}</span>
        </div>
      </header>

      <!-- Liste -->
      <div class="grid gap-3 mb-6">
        <div *ngFor="let a of list()" class="card card--row">
          <div class="min-w-0">
            <div class="card__title">
              {{ a.label || 'Adresse' }}
              <span *ngIf="a.isDefault" class="chip chip--success">Par défaut</span>
            </div>
            <div class="text-sm text-gray-700 truncate">
              {{ a.street }}, {{ a.postalCode }} {{ a.city }}, {{ a.country }}
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button class="btn btn--ghost" [disabled]="a.isDefault" (click)="makeDefault(a)">
              Définir par défaut
            </button>

            <!-- NOUVEAU: bouton modifier -->
            <button class="btn btn--ghost" (click)="startEdit(a)">Modifier</button>

            <button class="btn btn--danger" (click)="remove(a)">Supprimer</button>
          </div>

          <!-- FORM D'EDITION INLINE -->
          <div *ngIf="editId === a.id" class="edit-inline mt-3 grid gap-4">

  <!-- Libellé -->
  <label class="field">
    <span class="field__label">Libellé</span>
    <input
      class="input"
      [(ngModel)]="edit.label"
      name="edit_label_{{a.id}}"
      maxlength="40"
      placeholder="Maison, Bureau…"
    />
  </label>

  <!-- Rue -->
  <label class="field">
    <span class="field__label">Rue (ligne complète) *</span>
    <input
      class="input"
      [(ngModel)]="edit.street"
      name="edit_street_{{a.id}}"
      maxlength="120"
      required
      [class.ng-invalid]="!edit.street"
      [class.ng-touched]="true"
      placeholder="1 avenue de la paix, Bât. B, Appt 12"
    />
    <div class="field__error" *ngIf="!edit.street">
      <i class="fa-solid fa-circle-xmark"></i> L’adresse est requise.
    </div>
  </label>

  <!-- Ligne ville / CP -->
  <div class="grid sm:grid-cols-3 gap-3">
    <label class="field">
      <span class="field__label">Code postal *</span>
      <input
        class="input"
        [(ngModel)]="edit.postalCode"
        name="edit_postal_{{a.id}}"
        appDigitsOnly
        [appDigitsOnlyMax]="countryIsFR(edit.countryCode) ? 5 : 10"
        (input)="onEditPostalInput()"
        [class.ng-invalid]="!isPostalValid(edit.postalCode, edit.countryCode)"
        [class.ng-touched]="true"
        placeholder="{{ countryIsFR(edit.countryCode) ? '75002' : 'Code postal' }}"
        required
      />
      <div class="field__error" *ngIf="!isPostalValid(edit.postalCode, edit.countryCode)">
        <i class="fa-solid fa-circle-xmark"></i>
        {{ countryIsFR(edit.countryCode) ? 'Code postal français à 5 chiffres requis.' : 'Code postal invalide (4 à 10 chiffres).' }}
      </div>
      <div class="field__success" *ngIf="isPostalValid(edit.postalCode, edit.countryCode)">
        <i class="fa-solid fa-circle-check"></i> Valide
      </div>
    </label>

    <label class="field sm:col-span-2">
      <span class="field__label">Ville *</span>
      <input
        class="input"
        [(ngModel)]="edit.city"
        name="edit_city_{{a.id}}"
        maxlength="60"
        (input)="onEditCityInput($event)"
        [class.ng-invalid]="!isCityValid(edit.city)"
        [class.ng-touched]="true"
        placeholder="Brunoy"
        required
      />
      <div class="field__error" *ngIf="!isCityValid(edit.city)">
        <i class="fa-solid fa-circle-xmark"></i> Ville invalide (2–60 lettres).
      </div>
      <div class="field__success" *ngIf="isCityValid(edit.city)">
        <i class="fa-solid fa-circle-check"></i> Valide
      </div>
    </label>
  </div>

  <!-- Pays -->
  <div>
    <span class="block text-sm text-gray-600 mb-1">Pays *</span>
    <ng-select
      class="ng-country"
      [(ngModel)]="edit.countryCode"
      name="edit_country_{{a.id}}"
      [items]="countries"
      bindLabel="name"
      bindValue="code"
      [searchable]="true"
      [clearable]="false"
      placeholder="Choisir un pays…"
      required
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

  <!-- Actions -->
  <div class="flex gap-2">
    <button
      type="button"
      class="btn btn--primary"
      (click)="saveEdit(a)"
      [disabled]="!editFormValid()"
      [class.opacity-50]="!editFormValid()"
    >
      Enregistrer
    </button>
    <button type="button" class="btn" (click)="cancelEdit()">Annuler</button>
  </div>
</div>
          <!-- FIN EDIT INLINE -->
        </div>

        <div *ngIf="!list().length" class="card text-sm text-gray-600">
          Aucune adresse enregistrée. Ajoute ta première adresse ci-dessous.
        </div>
      </div>

      <!-- Formulaire ajout (inchangé) -->
      <form #addrForm="ngForm" novalidate (ngSubmit)="add(addrForm)" class="card grid gap-4">
        <div class="form__title">Ajouter une adresse</div>

        <div class="grid sm:grid-cols-2 gap-3">
          <!-- Libellé -->
          <label class="field sm:col-span-2">
            <span class="field__label">Libellé (Domicile, Bureau)</span>
            <input class="input" [(ngModel)]="form.label" name="label" maxlength="40" />
          </label>

          <!-- N° rue -->
          <label class="field">
            <span class="field__label">Numéro</span>
            <input
              class="input"
              name="streetNumber"
              [(ngModel)]="form.streetNumber"
              required
              appDigitsOnly
              [appDigitsOnlyMax]="5"
              pattern="^[0-9]{1,5}$"
              placeholder="12"
              #streetNumber="ngModel"
            />
            <div
              *ngIf="streetNumber.invalid && (streetNumber.touched || addrForm.submitted)"
              class="field__error"
            >
              <i class="fa-solid fa-circle-xmark"></i> Le numéro est requis (1 à 5 chiffres).
            </div>
            <div *ngIf="streetNumber.valid" class="field__success">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </label>

          <!-- Nom de rue -->
          <label class="field">
            <span class="field__label">Nom de la rue</span>
            <input
              class="input"
              name="streetName"
              [(ngModel)]="form.streetName"
              required
              pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’ .-]{2,60}$"
              maxlength="60"
              placeholder="Rue des Capucines"
              #streetName="ngModel"
            />
            <div
              *ngIf="streetName.invalid && (streetName.touched || addrForm.submitted)"
              class="field__error"
            >
              <i class="fa-solid fa-circle-xmark"></i> Nom de rue invalide (2–60 caractères, sans
              chiffres).
            </div>
            <div *ngIf="streetName.valid" class="field__success">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </label>

          <!-- Complément (optionnel) -->
          <label class="field sm:col-span-2">
            <span class="field__label">Complément (optionnel)</span>
            <input
              class="input"
              name="streetComplement"
              [(ngModel)]="form.streetComplement"
              maxlength="80"
              pattern="^[A-Za-zÀ-ÖØ-öø-ÿ0-9'’ ,./()-]{0,80}$"
              placeholder="Bât. B, Appartement 12"
              #streetComplement="ngModel"
            />
            <div
              *ngIf="streetComplement.invalid && (streetComplement.touched || addrForm.submitted)"
              class="field__error"
            >
              <i class="fa-solid fa-circle-xmark"></i> Caractères non autorisés (max 80).
            </div>
            <div *ngIf="streetComplement.valid && form.streetComplement" class="field__success">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </label>

          <!-- Code postal -->
          <label class="field">
            <span class="field__label">Code postal</span>
            <input
              class="input"
              name="postalCode"
              [(ngModel)]="form.postalCode"
              required
              appDigitsOnly
              [appDigitsOnlyMax]="5"
              pattern="^[0-9]{5}$"
              placeholder="75002"
              #postalCode="ngModel"
            />
            <div
              *ngIf="postalCode.invalid && (postalCode.touched || addrForm.submitted)"
              class="field__error"
            >
              <i class="fa-solid fa-circle-xmark"></i> Code postal invalide (5 chiffres).
            </div>
            <div *ngIf="postalCode.valid" class="field__success">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </label>

          <!-- Ville -->
          <label class="field">
            <span class="field__label">Ville</span>
            <input
              class="input"
              name="city"
              [(ngModel)]="form.city"
              required
              pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’ .-]{2,60}$"
              maxlength="60"
              placeholder="Paris"
              #city="ngModel"
            />
            <div class="field__error" *ngIf="city.invalid && (city.touched || addrForm.submitted)">
              <i class="fa-solid fa-circle-xmark"></i> Ville invalide (2–60 lettres).
            </div>
            <div class="field__success" *ngIf="city.valid">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </label>

          <!-- Pays (ng-select + ngModel, dynamique ISO) -->
          <div class="sm:col-span-2">
            <label class="block text-sm text-gray-600 mb-1" for="country">Pays</label>

            <ng-select
              id="country"
              class="ng-country"
              name="country"
              [(ngModel)]="form.countryCode"
              [items]="countries"
              bindLabel="name"
              bindValue="code"
              [searchable]="true"
              [clearable]="false"
              placeholder="Choisir un pays…"
              required
              #country="ngModel"
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

            <div
              class="field__error"
              *ngIf="country.invalid && (country.touched || addrForm.submitted)"
            >
              <i class="fa-solid fa-circle-xmark"></i> Le pays est requis.
            </div>
            <div class="field__success" *ngIf="country.valid">
              <i class="fa-solid fa-circle-check"></i> Valide
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="btn btn--primary"
            [disabled]="count() >= max || !addrForm.valid"
          >
            Ajouter
          </button>
          <span *ngIf="count() >= max" class="text-xs text-amber-600">
            Vous avez atteint la limite de {{ max }} adresses.
          </span>
        </div>
      </form>
    </section>
  `,
  styleUrls: ['./addresses.component.scss'],
})
export class AddressesComponent {
  private readonly store = inject(AddressesStore);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  list = this.store.items;
  count = this.store.count;
  max = this.store.max;

  countries: CountryOpt[] = this.buildCountries();
  private countriesByCode = new Map(this.countries.map((c) => [c.code, c.name]));

  form: {
    label: string;
    streetNumber: string;
    streetName: string;
    streetComplement: string;
    postalCode: string;
    city: string;
    countryCode: string; // ISO-2
    isDefault: boolean;
  } = {
      label: '',
      streetNumber: '',
      streetName: '',
      streetComplement: '',
      postalCode: '',
      city: '',
      countryCode: '',
      isDefault: false,
    };

  // EDIT STATE
  editId: string | null = null;
  edit: {
    label?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode?: string;
  } = {};

  isValid(f: NgForm, name: string): boolean {
    const c = f.controls[name];
    return !!c && c.valid;
  }

  flagClass(code: string): string {
    return `fi fi-${code.toLowerCase()}`;
  }

  private buildCountries(): CountryOpt[] {
    try {
      isoCountries.registerLocale(frLocale as LocaleData);
      const names = isoCountries.getNames('fr', { select: 'official' }) as Record<string, string>;
      const list = Object.entries(names)
        .filter(([code]) => /^[A-Z]{2}$/.test(code))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      const i = list.findIndex((x) => x.code === 'FR');
      if (i > 0) list.unshift(list.splice(i, 1)[0]);
      return list;
    } catch {
      return [
        { code: 'FR', name: 'France' },
        { code: 'BE', name: 'Belgique' },
        { code: 'CH', name: 'Suisse' },
      ];
    }
  }

  add(f: NgForm): void {
    if (!f.valid) return;

    const composedStreet = [
      this.form.streetNumber?.trim(),
      this.form.streetName?.trim(),
      this.form.streetComplement?.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    const countryName = this.countriesByCode.get(this.form.countryCode) ?? this.form.countryCode;

    const payload: Omit<Address, 'id'> = {
      label: this.form.label?.trim(),
      street: composedStreet,
      city: this.form.city?.trim(),
      postalCode: this.form.postalCode?.trim(),
      country: countryName,
      isDefault: this.form.isDefault,
    };

    try {
      this.store.add(payload);
      f.resetForm({
        label: '',
        streetNumber: '',
        streetName: '',
        streetComplement: '',
        postalCode: '',
        city: '',
        countryCode: '',
        isDefault: false,
      });
      this.toast.success('Adresse ajoutée.');
    } catch {
      this.toast.info('Vous avez atteint la limite de 3 adresses.');
    }
  }

  remove(a: Address): void {
    this.store.remove(a.id);
    this.toast.info('Adresse supprimée.');
  }

  makeDefault(a: Address): void {
    this.store.setDefault(a.id);
    this.toast.success('Adresse définie par défaut.');
  }

  // EDIT helpers
  private countryCodeFromName(name: string): string | undefined {
    const entry = this.countries.find(c => c.name === name);
    return entry?.code;
  }

  private countryNameFromCode(code?: string): string | undefined {
    if (!code) return undefined;
    return this.countriesByCode.get(code) ?? code;
  }

  startEdit(a: Address): void {
    this.editId = a.id;
    this.edit = {
      label: a.label || '',
      street: a.street,
      city: a.city,
      postalCode: a.postalCode,
      countryCode: this.countryCodeFromName(a.country) || 'FR',
    };
  }

  saveEdit(a: Address): void {
    const patch: Partial<Address> = {
      label: (this.edit.label || '').trim() || undefined,
      street: (this.edit.street || '').trim() || undefined,
      city: (this.edit.city || '').trim() || undefined,
      postalCode: (this.edit.postalCode || '').trim() || undefined,
      country: this.countryNameFromCode(this.edit.countryCode),
    };
    this.store.update(a.id, patch);
    this.toast.success('Adresse mise à jour.');
    this.editId = null;
  }

  cancelEdit(): void {
    this.editId = null;
  }

  countryIsFR(code?: string): boolean {
    return (code || 'FR').toUpperCase() === 'FR';
  }

  isPostalValid(value: string | undefined, countryCode?: string): boolean {
    const digits = (value || '').replace(/\D/g, '');
    if (this.countryIsFR(countryCode)) return /^\d{5}$/.test(digits);
    return digits.length >= 4 && digits.length <= 10;
  }

  isCityValid(value: string | undefined): boolean {
    const v = (value || '').trim();
    if (v.length < 2 || v.length > 60) return false;
    // lettres + accents + espaces/traits/apostrophes/points
    return /^[A-Za-zÀ-ÖØ-öø-ÿ'’ .-]{2,60}$/.test(v);
  }

  onEditCityInput(ev: Event): void {
    const el = ev.target as HTMLInputElement | null;
    if (!el) return;
    // supprime les chiffres
    this.edit.city = (el.value || '').replace(/\d/g, '');
  }

  onEditPostalInput(): void {
    // rien de spécial ici, appDigitsOnly gère les chiffres; on garde la méthode si tu veux brancher une logique ultérieure
  }

  editFormValid(): boolean {
    return !!this.edit.street
      && this.isCityValid(this.edit.city)
      && this.isPostalValid(this.edit.postalCode, this.edit.countryCode)
      && !!this.edit.countryCode;
  }


  logout(): void {
    this.auth.logout();
  }
}
