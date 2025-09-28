import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PaymentsStore, PaymentMethod, PaymentBrand } from '../../services/payments-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { DigitsOnlyDirective } from '../../../../shared/directives/digits-only.directive';

interface PaymentForm {
  brand: PaymentBrand;
  pan12: string;
  holder: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  label?: string;
  cvc?: string; // non stocké, validation seulement
}

@Component({
  standalone: true,
  selector: 'app-profile-payments',
  imports: [CommonModule, FormsModule, DigitsOnlyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./payments.component.scss'],
  template: `
    <section class="max-w-4xl mx-auto p-4 sm:p-6 relative">
      <header class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Moyens de paiement</h1>
      </header>

      <!-- LISTE EXISTANTE -->
      <div class="grid gap-3 mb-6">
        <div *ngFor="let p of list(); trackBy: trackById" class="p-4 rounded-2xl card">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <i [class]="brandIcon(p.brand)" class="text-2xl shrink-0" aria-hidden="true"></i>
              <div class="text-sm min-w-0">
                <!-- Label mis en avant -->
                <div class="font-semibold text-gray-900 truncate" *ngIf="p.label; else noLabel">
                  {{ p.label }}
                  <span
                    *ngIf="p.isDefault"
                    class="ml-2 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-200"
                  >
                    Par défaut
                  </span>
                </div>
                <ng-template #noLabel>
                  <div class="font-semibold text-gray-900 truncate">
                    {{ p.brand | uppercase }} •••• {{ p.last4 }}
                    <span
                      *ngIf="p.isDefault"
                      class="ml-2 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-200"
                    >
                      Par défaut
                    </span>
                  </div>
                </ng-template>

                <!-- Ligne secondaire -->
                <div class="text-gray-600 truncate">
                  {{ p.brand | uppercase }} •••• {{ p.last4 }} • Exp {{ two(p.expMonth) }}/{{
                    p.expYear
                  }}
                  <span *ngIf="p.holder">• {{ p.holder }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 shrink-0">
              <button class="btn-ter" [disabled]="p.isDefault" (click)="makeDefault(p)">
                Définir par défaut
              </button>
              <button class="btn-ter" (click)="startEdit(p)">Modifier</button>
              <button class="btn-danger" (click)="remove(p)">Supprimer</button>
            </div>
          </div>

          <!-- FORMULAIRE D'EDITION INLINE -->
          <div *ngIf="editId === p.id" class="mt-3 grid gap-3">
            <label class="field">
              <span class="label">Nom (alias)</span>
              <input
                class="input"
                [(ngModel)]="edit.label"
                name="edit_label_{{ p.id }}"
                maxlength="40"
              />
            </label>

            <label class="field">
              <span class="label">Titulaire</span>
              <input
                class="input"
                [(ngModel)]="edit.holder"
                name="edit_holder_{{ p.id }}"
                minlength="2"
                (input)="onEditHolderInput($event)"
                pattern="^[A-Za-zÀ-ÿ' -]{2,}$"
              />
            </label>

            <label class="field">
              <span class="label">Expiration</span>
              <input
                type="month"
                class="input"
                [min]="minMonthAttr"
                [max]="maxMonthAttr"
                [(ngModel)]="editExpiry"
                name="edit_expiry_{{ p.id }}"
                (ngModelChange)="onEditExpiryChange($event)"
              />
            </label>

            <div class="flex gap-2">
              <button type="button" class="btn-pri" (click)="saveEdit(p)">Enregistrer</button>
              <button type="button" class="btn-ter" (click)="cancelEdit()">Annuler</button>
            </div>
          </div>
          <!-- FIN EDIT INLINE -->
        </div>

        <div *ngIf="!list().length" class="p-6 rounded-2xl card text-sm text-gray-600">
          Aucun moyen de paiement enregistré.
        </div>
      </div>

      <!-- FORMULAIRE AJOUT -->
      <form
        #pmForm="ngForm"
        (ngSubmit)="add(pmForm)"
        novalidate
        class="rounded-3xl card p-5 sm:p-6 grid gap-5"
      >
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-base font-semibold text-gray-900">Ajouter un moyen de paiement</div>
        </div>

        <!-- alias -->
        <div>
          <span class="label">Nom (alias)</span>
          <input
            name="label"
            class="input"
            [(ngModel)]="form.label"
            maxlength="40"
            placeholder="ex. Carte pro"
          />
        </div>

        <!-- PREVIEW CARTE -->
        <div class="card-preview" aria-hidden="true">
          <div class="cp-top"><i [class]="brandIcon(form.brand)"></i></div>
          <div class="cp-number">{{ formatPanPreview(form.pan12) }}</div>
          <div class="cp-bottom">
            <div class="cp-holder">
              <span>Titulaire</span><strong>{{ form.holder || '—' }}</strong>
            </div>
            <div class="cp-exp">
              <span>Exp</span><strong>{{ two(form.expMonth) }}/{{ form.expYear || '—' }}</strong>
            </div>
            <div class="cp-cvc">
              <span>CVC</span>
              <strong>{{ form.cvc || '—' }}</strong>
            </div>
          </div>
        </div>

        <!-- MARQUE -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <label *ngFor="let b of brands" class="brand-tile" [class.active]="form.brand === b">
            <input type="radio" name="brand" [(ngModel)]="form.brand" [value]="b" required hidden />
            <i [class]="brandIcon(b)" aria-hidden="true"></i>
            <span class="capitalize">{{ b }}</span>
          </label>
        </div>

        <!-- NUMÉRO 12 CHIFFRES -->
        <div>
          <span class="label">Numéro de carte</span>
          <input
            name="pan12"
            class="input"
            [(ngModel)]="form.pan12"
            #pan="ngModel"
            appDigitsOnly
            [appDigitsOnlyMax]="12"
            maxlength="12"
            inputmode="numeric"
            pattern="\\d{12}"
            placeholder="Saisir 12 chiffres"
            required
          />
          <div class="field-hint">
            <span
              *ngIf="pan.invalid && (pan.dirty || pan.touched || pmForm.submitted)"
              class="text-red-600"
            >
              12 chiffres requis.
            </span>
            <span
              *ngIf="pan.valid && (pan.dirty || pan.touched)"
              class="text-green-600"
              title="Validé"
            >
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span class="sr-only">Numéro valide</span>
            </span>
          </div>
        </div>

        <!-- CVC -->
        <div>
          <span class="label">CVC</span>
          <input
            name="cvc"
            class="input"
            [(ngModel)]="form.cvc"
            #cvc="ngModel"
            appDigitsOnly
            [appDigitsOnlyMax]="cvcMax()"
            [attr.maxlength]="cvcMax()"
            inputmode="numeric"
            [pattern]="cvcPattern()"
            placeholder="3 chiffres (4 pour Amex)"
            required
          />
          <div class="field-hint">
            <span
              *ngIf="cvc.invalid && (cvc.dirty || cvc.touched || pmForm.submitted)"
              class="text-red-600"
            >
              {{ cvcMax() }} chiffres requis.
            </span>
            <span
              *ngIf="cvc.valid && (cvc.dirty || cvc.touched)"
              class="text-green-600"
              title="Validé"
            >
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span class="sr-only">CVC valide</span>
            </span>
          </div>
        </div>

        <!-- TITULAIRE -->
        <div>
          <span class="label">Nom sur la carte</span>
          <input
            name="holder"
            class="input"
            [(ngModel)]="form.holder"
            #holder="ngModel"
            (input)="preventDigits('holder')"
            minlength="2"
            pattern="^[A-Za-zÀ-ÿ' -]{2,}$"
            placeholder="Comme indiqué sur la carte"
            required
          />
          <div class="field-hint">
            <span
              *ngIf="holder.invalid && (holder.dirty || holder.touched || pmForm.submitted)"
              class="text-red-600"
            >
              Au moins 2 lettres, pas de chiffres.
            </span>
            <span
              *ngIf="holder.valid && (holder.dirty || holder.touched)"
              class="text-green-600"
              title="Validé"
            >
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span class="sr-only">Nom valide</span>
            </span>
          </div>
        </div>

        <!-- EXPIRATION -->
        <div>
          <span class="label">Date d'expiration</span>
          <input
            type="month"
            class="input"
            [min]="minMonthAttr"
            [max]="maxMonthAttr"
            [(ngModel)]="expiry"
            name="expiry"
            #exp="ngModel"
            (ngModelChange)="onExpiryChange($event)"
            required
          />
          <div class="field-hint">
            <span
              *ngIf="!expiryValid() && (exp.dirty || exp.touched || pmForm.submitted)"
              class="text-red-600"
            >
              Sélectionnez un mois/année valide.
            </span>
            <span
              *ngIf="expiryValid() && (exp.dirty || exp.touched)"
              class="text-green-600"
              title="Validé"
            >
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span class="sr-only">Date valide</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" class="btn-pri" [disabled]="!formValid()">Ajouter</button>
        </div>
      </form>
    </section>
  `,
})
export class PaymentsComponent {
  private store = inject(PaymentsStore);
  private toast = inject(ToastService);

  list = this.store.items;

  readonly brands: PaymentBrand[] = ['visa', 'mastercard', 'amex', 'paypal', 'other'];

  readonly minYear = new Date().getFullYear();
  readonly maxYear = this.minYear + 15;

  get minMonthAttr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${this.two(d.getMonth() + 1)}`;
  }
  get maxMonthAttr(): string {
    return `${this.maxYear}-12`;
  }

  form: PaymentForm = {
    brand: 'visa',
    pan12: '',
    holder: '',
    expMonth: 12,
    expYear: this.minYear + 5,
    isDefault: false,
    label: '',
    cvc: '',
  };

  expiry = `${this.form.expYear}-${this.two(this.form.expMonth)}`;

  trackById = (_: number, p: PaymentMethod) => p.id;

  // EDIT STATE
  editId: string | null = null;
  edit: { label?: string; holder?: string; expMonth?: number; expYear?: number } = {};
  editExpiry = '';

  /* ===== Helpers ===== */
  two(n: number | string): string {
    const v = typeof n === 'number' ? n : parseInt(n || '0', 10);
    return String(v).padStart(2, '0');
  }

  brandIcon(b: PaymentBrand): string {
    switch (b) {
      case 'visa':
        return 'fa-brands fa-cc-visa';
      case 'mastercard':
        return 'fa-brands fa-cc-mastercard';
      case 'amex':
        return 'fa-brands fa-cc-amex';
      case 'paypal':
        return 'fa-brands fa-cc-paypal';
      default:
        return 'fa-solid fa-credit-card';
    }
  }

  formatPanPreview(pan12: string): string {
    const raw = (pan12 ?? '').replace(/\D/g, '').slice(0, 12);
    const masked = raw.padEnd(12, '•');
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  preventDigits(control: 'holder'): void {
    this.form[control] = this.form[control].replace(/[0-9]/g, '');
  }

  // CVC helpers
  cvcMax(): number {
    return this.form.brand === 'amex' ? 4 : 3;
  }
  cvcPattern(): string {
    return this.form.brand === 'amex' ? '\\d{4}' : '\\d{3}';
  }
  cvcValid(): boolean {
    const max = this.cvcMax();
    return new RegExp(`^\\d{${max}}$`).test(this.form.cvc || '');
  }

  holderValid(): boolean {
    const v = (this.form.holder || '').trim();
    return v.length >= 2 && /^[A-Za-zÀ-ÿ' -]+$/.test(v);
  }

  expiryValid(): boolean {
    const y = this.form.expYear;
    const m = this.form.expMonth;
    if (!y || !m) return false;
    if (y < this.minYear || y > this.maxYear) return false;
    if (m < 1 || m > 12) return false;
    const now = new Date();
    const cmp = new Date(y, m - 1, 1);
    const floorNow = new Date(now.getFullYear(), now.getMonth(), 1);
    return cmp >= floorNow;
  }

  panValid(): boolean {
    return /^\d{12}$/.test(this.form.pan12);
  }

  formValid(): boolean {
    return this.panValid() && this.cvcValid() && this.holderValid() && this.expiryValid();
  }

  onExpiryChange(value: string): void {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (match) {
      this.form.expYear = parseInt(match[1], 10);
      this.form.expMonth = parseInt(match[2], 10);
    }
  }

  /* ===== Actions ===== */
  onEditHolderInput(ev: Event): void {
    const el = ev.target as HTMLInputElement | null;
    const raw = el?.value ?? '';
    this.edit.holder = raw.replace(/\d/g, '');
  }

  add(f: NgForm): void {
    if (!this.formValid()) {
      this.toast.warning(
        'Complétez correctement les champs requis (numéro, CVC, titulaire, expiration).'
      );
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
      label: (this.form.label ?? '').trim(),
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

  /* ===== Edition ===== */
  startEdit(p: PaymentMethod): void {
    this.editId = p.id;
    this.edit = { label: p.label, holder: p.holder, expMonth: p.expMonth, expYear: p.expYear };
    this.editExpiry = `${p.expYear}-${this.two(p.expMonth)}`;
  }

  onEditExpiryChange(value: string): void {
    const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (m) {
      this.edit.expYear = parseInt(m[1], 10);
      this.edit.expMonth = parseInt(m[2], 10);
    }
  }

  saveEdit(p: PaymentMethod): void {
    const patch: Partial<PaymentMethod> = {
      label: (this.edit.label || '').trim() || undefined,
      holder: (this.edit.holder || '').trim() || undefined,
      expMonth: this.edit.expMonth!,
      expYear: this.edit.expYear!,
    };
    this.store.update(p.id, patch);
    this.toast.success('Moyen de paiement mis à jour.');
    this.editId = null;
  }

  cancelEdit(): void {
    this.editId = null;
  }

  private resetForm(f: NgForm): void {
    f.resetForm({
      brand: 'visa',
      pan12: '',
      holder: '',
      expMonth: 12,
      expYear: this.minYear + 5,
      isDefault: false,
      expiry: `${this.minYear + 5}-12`,
      label: '',
      cvc: '',
    });
    this.form.brand = 'visa';
    this.form.pan12 = '';
    this.form.holder = '';
    this.form.expMonth = 12;
    this.form.expYear = this.minYear + 5;
    this.form.isDefault = false;
    this.form.label = '';
    this.form.cvc = '';
    this.expiry = `${this.form.expYear}-${this.two(this.form.expMonth)}`;
  }
}
