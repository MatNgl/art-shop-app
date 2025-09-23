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

import { AuthService } from '../../../auth/services/auth';
import { FrPhoneMaskDirective } from '../../../../shared/directives/fr-phone-mask.directive';
// import { FrPhonePipe } from '../../../../shared/pipes/fr-phone.pipe';
import type { User } from '../../../auth/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FrPhoneMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Mon profil</h1>

      @if (!user()) {
      <div class="bg-white rounded-xl shadow p-6">
        <p class="text-gray-700">Vous devez être connecté pour accéder à cette page.</p>
        <a class="text-blue-600 underline" routerLink="/auth/login">Se connecter</a>
      </div>
      } @else {
      <!-- ===== Formulaire infos ===== -->
      <form
        class="bg-white rounded-2xl shadow-sm border p-6 space-y-6 mb-8"
        [formGroup]="form"
        (ngSubmit)="save()"
      >
        <section>
          <h2 class="font-semibold mb-4 text-gray-900">Informations personnelles</h2>

          <div class="grid md:grid-cols-2 gap-4">
            <!-- Prénom -->
            <div>
              <label class="block text-sm text-gray-600 mb-1" for="firstName">Prénom</label>
              <input
                id="firstName"
                class="input"
                formControlName="firstName"
                autocomplete="given-name"
              />
              <div class="field-status field-status--error" *ngIf="isInvalid('firstName')">
                <i class="fa-solid fa-circle-xmark"></i>
                <span>Le prénom est requis (lettres, espaces et tirets).</span>
              </div>
              <div class="field-status field-status--ok" *ngIf="isValid('firstName')">
                <i class="fa-solid fa-circle-check"></i><span class="sr-only">Valide</span>
              </div>
            </div>

            <!-- Nom -->
            <div>
              <label class="block text-sm text-gray-600 mb-1" for="lastName">Nom</label>
              <input
                id="lastName"
                class="input"
                formControlName="lastName"
                autocomplete="family-name"
              />
              <div class="field-status field-status--error" *ngIf="isInvalid('lastName')">
                <i class="fa-solid fa-circle-xmark"></i>
                <span>Le nom est requis (lettres, espaces et tirets).</span>
              </div>
              <div class="field-status field-status--ok" *ngIf="isValid('lastName')">
                <i class="fa-solid fa-circle-check"></i><span class="sr-only">Valide</span>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4 mt-4">
            <!-- Email -->
            <div>
              <label class="block text-sm text-gray-600 mb-1" for="email">Email</label>
              <input
                id="email"
                class="input"
                formControlName="email"
                type="email"
                autocomplete="email"
              />
              <div class="field-status field-status--error" *ngIf="isInvalid('email')">
                <i class="fa-solid fa-circle-xmark"></i><span>Email invalide.</span>
              </div>
              <div class="field-status field-status--ok" *ngIf="isValid('email')">
                <i class="fa-solid fa-circle-check"></i><span class="sr-only">Valide</span>
              </div>
            </div>

            <!-- Téléphone -->
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

              <div class="field-status field-status--error" *ngIf="isInvalid('phone')">
                <i class="fa-solid fa-circle-xmark"></i>
                <span>Numéro FR attendu (10 chiffres, ex&nbsp;: 06 12 34 56 78).</span>
              </div>
              <div
                class="field-status field-status--ok"
                *ngIf="isValid('phone') && form.value.phone"
              >
                <i class="fa-solid fa-circle-check"></i><span class="sr-only">Valide</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions formulaire -->
        <div class="flex flex-wrap gap-3 pt-2 border-t">
          <button class="btn btn--primary" [disabled]="form.invalid || form.pristine || saving()">
            <i class="fa-solid fa-floppy-disk mr-2" *ngIf="!saving()"></i>
            <i class="fa-solid fa-spinner fa-spin mr-2" *ngIf="saving()"></i>
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>

          <button
            type="button"
            class="btn btn--secondary"
            [disabled]="form.pristine || saving()"
            (click)="reset()"
          >
            <i class="fa-solid fa-arrow-rotate-left mr-2"></i>
            Réinitialiser
          </button>

          @if (saved()) {
          <div class="success-badge">
            <i class="fa-solid fa-circle-check mr-2"></i>
            Modifications enregistrées
          </div>
          }
        </div>
      </form>

      <!-- ===== Actions rapides AMÉLIORÉES ===== -->
      <section>
        <div class="section-header">
          <h2 class="section-title">Actions rapides</h2>
          <p class="section-subtitle">Gérez facilement votre compte et vos préférences</p>
        </div>

        <div class="actions-grid">
          <!-- Adresses -->
          <a routerLink="/profile/addresses" class="action-card group action-card--blue">
            <div class="action-card__icon">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="action-card__content">
              <h1 class="action-card__title">Mes adresses</h1>
              <p class="action-card__desc">Gérer vos adresses de livraison et facturation</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </a>

          <!-- Paiements -->
          <a routerLink="/profile/payments" class="action-card group action-card--green">
            <div class="action-card__icon">
              <i class="fa-solid fa-credit-card"></i>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">Paiements</h3>
              <p class="action-card__desc">Cartes bancaires et moyens de paiement</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </a>

          <!-- Commandes -->
          <a routerLink="/profile/orders" class="action-card group action-card--purple">
            <div class="action-card__icon">
              <i class="fa-solid fa-bag-shopping"></i>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">Mes commandes</h3>
              <p class="action-card__desc">Historique d'achats et suivi de livraisons</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </a>

          <!-- Favoris -->
          <a routerLink="/profile/favorites" class="action-card group action-card--pink">
            <div class="action-card__icon">
              <i class="fa-solid fa-heart"></i>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">Mes favoris</h3>
              <p class="action-card__desc">Œuvres sauvegardées pour plus tard</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </a>

          <!-- Mot de passe -->
          <a routerLink="/auth/change-password" class="action-card group action-card--orange">
            <div class="action-card__icon">
              <i class="fa-solid fa-key"></i>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">Sécurité</h3>
              <p class="action-card__desc">Modifier votre mot de passe</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </a>

          <!-- Déconnexion -->
          <button type="button" class="action-card group action-card--red" (click)="logout()">
            <div class="action-card__icon">
              <i class="fa-solid fa-right-from-bracket"></i>
            </div>
            <div class="action-card__content">
              <h3 class="action-card__title">Déconnexion</h3>
              <p class="action-card__desc">Fermer votre session en cours</p>
            </div>
            <div class="action-card__arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </button>
        </div>
      </section>
      }
    </div>
  `,
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  user = computed<User | null>(() => this.auth.currentUser$());
  saving = signal<boolean>(false);
  saved = signal<boolean>(false);
  submitted = signal<boolean>(false);

  private readonly alphaFr = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  private readonly frPhoneValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const raw: unknown = ctrl.value;
    if (raw === null || raw === '') return null; // optionnel
    const digits = String(raw).replace(/\D/g, '');
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
    phone: ['', [this.frPhoneValidator]], // optionnel
  });

  constructor() {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
      });
    }
  }

  isInvalid(ctrlName: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[ctrlName];
    return c.invalid && (c.touched || this.submitted());
  }
  isValid(ctrlName: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[ctrlName];
    return c.valid && (c.touched || this.submitted());
  }

  reset(): void {
    const u = this.user();
    if (!u) return;
    this.form.reset({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
    });
    this.saved.set(false);
    this.submitted.set(false);
  }

  async save(): Promise<void> {
    this.submitted.set(true);
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
      });
      this.form.markAsPristine();
      this.saved.set(true);
    } catch (e) {
      console.error(e);
      alert("Impossible d'enregistrer le profil.");
    } finally {
      this.saving.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
