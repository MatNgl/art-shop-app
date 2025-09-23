import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PaymentsStore, PaymentMethod, PaymentBrand } from '../../services/payments-store';
import { ToastService } from '../../../../shared/services/toast.service';

interface PaymentForm {
  brand: PaymentBrand;
  pan12: string;
  holder: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

@Component({
  standalone: true,
  selector: 'app-profile-payments',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./payments.component.scss'],
  template: `
    <section class="max-w-4xl mx-auto p-4 sm:p-6 relative">
      <header class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Moyens de paiement</h1>
      </header>

      <!-- LISTE EXISTANTE -->
      <div class="grid gap-3 mb-6">
        <div *ngFor="let p of list(); trackBy: trackById"
             class="p-4 rounded-2xl card">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <i [class]="brandIcon(p.brand)" class="text-2xl shrink-0"></i>
              <div class="text-sm min-w-0">
                <div class="font-medium text-gray-900 uppercase truncate">
                  {{ p.brand }} •••• {{ p.last4 }}
                  <span *ngIf="p.isDefault"
                        class="ml-2 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-200">
                    Par défaut
                  </span>
                </div>
                <div class="text-gray-600 truncate">
                  Exp {{ two(p.expMonth) }}/{{ p.expYear }}
                  <span *ngIf="p.holder">• {{ p.holder }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 shrink-0">
              <button class="btn-ter" [disabled]="p.isDefault" (click)="makeDefault(p)">
                Définir par défaut
              </button>
              <button class="btn-danger" (click)="remove(p)">
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!list().length"
             class="p-6 rounded-2xl card text-sm text-gray-600">
          Aucun moyen de paiement enregistré.
        </div>
      </div>

      <!-- FORMULAIRE AJOUT -->
      <form #pmForm="ngForm" (ngSubmit)="add(pmForm)" novalidate
            class="rounded-3xl card p-5 sm:p-6 grid gap-5">

        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-base font-semibold text-gray-900">Ajouter un moyen de paiement</div>

        </div>

        <!-- PREVIEW CARTE -->
        <div class="card-preview">
          <div class="cp-top">
            <i [class]="brandIcon(form.brand)" aria-hidden="true"></i>
          </div>
          <div class="cp-number" aria-label="Numéro de carte">
            {{ formatPanPreview(form.pan12) }}
          </div>
          <div class="cp-bottom">
            <div class="cp-holder"><span>Titulaire</span><strong>{{ form.holder || '—' }}</strong></div>
            <div class="cp-exp"><span>Exp</span><strong>{{ two(form.expMonth) }}/{{ form.expYear || '—' }}</strong></div>
          </div>
        </div>

        <!-- MARQUE -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <span *ngFor="let b of brands" class="brand-tile"
                 [class.active]="form.brand === b">
            <input type="radio" name="brand" [ngModel]="form.brand" (ngModelChange)="form.brand = $event"
                   [value]="b" required hidden />
            <i [class]="brandIcon(b)" aria-hidden="true"></i>
            <span class="capitalize">{{ b }}</span>
          </span>
        </div>

        <!-- NUMÉRO 12 CHIFFRES -->
        <div>
          <span class="label">Numéro de carte (démo, 12 chiffres)</span>
          <input name="pan12"
                 class="input"
                 [(ngModel)]="form.pan12"
                 (input)="digitsOnly('pan12', 12)"
                 maxlength="12"
                 inputmode="numeric"
                 pattern="\\d{12}"
                 placeholder="Saisir 12 chiffres"
                 required />
          <div class="field-hint">
            <span *ngIf="!panValid()" class="text-red-600">12 chiffres requis.</span>
           <span *ngIf="panValid()" class="text-green-600" title="Validé">
            <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span class="sr-only">Numéro valide</span>
          </span>
          </div>
        </div>

        <!-- TITULAIRE -->
        <div>
          <span class="label">Nom sur la carte</span>
          <input name="holder"
                 class="input"
                 [(ngModel)]="form.holder"
                 (input)="preventDigits('holder')"
                 minlength="2"
                 placeholder="Comme indiqué sur la carte"
                 required />
          <div class="field-hint">
            <span *ngIf="!holderValid()" class="text-red-600">Au moins 2 lettres, pas de chiffres.</span>
            <span *ngIf="holderValid()" class="text-green-600" title="Validé">
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span class="sr-only">Nom valide</span>
            </span>

          </div>
        </div>

        <!-- EXPIRATION (MONTH PICKER) -->
        <div>
          <span class="label">Date d'expiration</span>
          <input type="month"
                 class="input"
                 [min]="minMonthAttr"
                 [max]="maxMonthAttr"
                 [(ngModel)]="expiry"
                 name="expiry"
                 (ngModelChange)="onExpiryChange($event)"
                 required />
          <div class="field-hint">
            <span *ngIf="!expiryValid()" class="text-red-600">Sélectionnez un mois/année valide.</span>
          <span *ngIf="expiryValid()" class="text-green-600" title="Validé">
            <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span class="sr-only">Date valide</span>
          </span>

          </div>
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" class="btn-pri" [disabled]="!formValid()">
            Ajouter
          </button>
        </div>
      </form>
    </section>
  `,
})
export class PaymentsComponent {
  private store = inject(PaymentsStore);
  private toast = inject(ToastService);

  // liste réactive depuis le store (signal)
  list = this.store.items;

  readonly brands: PaymentBrand[] = ['visa', 'mastercard', 'amex', 'paypal', 'other'];

  // bornes d’année : maintenant → +15 ans
  readonly minYear = new Date().getFullYear();
  readonly maxYear = this.minYear + 15;

  // bornes mois pour l'input type="month"
  get minMonthAttr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${this.two(d.getMonth() + 1)}`;
    // ex: "2025-09"
  }
  get maxMonthAttr(): string {
    return `${this.maxYear}-12`;
  }

  // modèle de formulaire (démo)
  form: PaymentForm = {
    brand: 'visa',
    pan12: '',
    holder: '',
    expMonth: 12,
    expYear: this.minYear + 5,
    isDefault: false,
  };

  // liaison pour l'input type="month" ("YYYY-MM")
  expiry = `${this.form.expYear}-${this.two(this.form.expMonth)}`;

  trackById = (_: number, p: PaymentMethod) => p.id;

  /* ===== Helpers UI / Validation ===== */
  two(n: number | string): string {
    const v = typeof n === 'number' ? n : parseInt(n || '0', 10);
    return String(v).padStart(2, '0');
  }

  brandIcon(b: PaymentBrand): string {
    switch (b) {
      case 'visa': return 'fa-brands fa-cc-visa';
      case 'mastercard': return 'fa-brands fa-cc-mastercard';
      case 'amex': return 'fa-brands fa-cc-amex';
      case 'paypal': return 'fa-brands fa-cc-paypal';
      default: return 'fa-solid fa-credit-card';
    }
  }

  digitsOnly(control: 'pan12', max: number): void {
    const sanitized = this.form[control].replace(/\D/g, '').slice(0, max);
    this.form[control] = sanitized;
  }

  formatPanPreview(pan12: string): string {
    const raw = (pan12 ?? '').replace(/\D/g, '').slice(0, 12);
    // complète avec des puces pour arriver à 12 caractères
    const masked = raw.padEnd(12, '•');
    // groupage 4-4-4
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  preventDigits(control: 'holder'): void {
    // supprime les chiffres, conserve lettres/espaces/accents, tirets et apostrophes
    this.form[control] = this.form[control].replace(/[0-9]/g, '');
  }

  panValid(): boolean {
    return /^\d{12}$/.test(this.form.pan12);
  }

  holderValid(): boolean {
    const v = (this.form.holder || '').trim();
    return v.length >= 2 && !/\d/.test(v);
  }

  expiryValid(): boolean {
    const y = this.form.expYear;
    const m = this.form.expMonth;
    if (!y || !m) return false;
    if (y < this.minYear || y > this.maxYear) return false;
    if (m < 1 || m > 12) return false;

    // pas de carte expirée
    const now = new Date();
    const cmp = new Date(y, m - 1, 1);
    const floorNow = new Date(now.getFullYear(), now.getMonth(), 1);
    return cmp >= floorNow;
  }

  formValid(): boolean {
    return this.panValid() && this.holderValid() && this.expiryValid();
  }

  onExpiryChange(value: string): void {
    // value = "YYYY-MM"
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (match) {
      this.form.expYear = parseInt(match[1], 10);
      this.form.expMonth = parseInt(match[2], 10);
    }
  }

  /* ===== Actions ===== */
  add(f: NgForm): void {
    if (!this.formValid()) {
      this.toast.warning('Complétez correctement les champs requis (12 chiffres, titulaire, expiration).');
      return;
    }

    const last4 = this.form.pan12.slice(-4);
    const payload: Omit<PaymentMethod, 'id'> = {
      brand: this.form.brand,
      last4,
      expMonth: this.form.expMonth,
      expYear: this.form.expYear,
      holder: this.form.holder.trim(),
      isDefault: this.form.isDefault,
    };

    this.store.add(payload);
    this.toast.success('Moyen de paiement ajouté.');
    this.resetForm(f);
  }

  remove(p: PaymentMethod): void {
    this.store.remove(p.id);
    this.toast.info('Moyen de paiement supprimé.');
  }

  makeDefault(p: PaymentMethod): void {
    this.store.setDefault(p.id);
    this.toast.success('Défini comme par défaut.');
  }

  private resetForm(f: NgForm): void {
    f.resetForm({
      brand: 'visa',
      pan12: '',
      holder: '',
      // reset sur 5 ans par défaut
      expMonth: 12,
      expYear: this.minYear + 5,
      isDefault: false,
      // pour l'input month
      expiry: `${this.minYear + 5}-12`,
    });
    this.form.brand = 'visa';
    this.form.pan12 = '';
    this.form.holder = '';
    this.form.expMonth = 12;
    this.form.expYear = this.minYear + 5;
    this.form.isDefault = false;
    this.expiry = `${this.form.expYear}-${this.two(this.form.expMonth)}`;
  }
}
