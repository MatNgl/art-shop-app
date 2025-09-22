import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PaymentsStore, PaymentMethod, PaymentBrand } from '../../services/payments-store';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-profile-payments',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="max-w-3xl mx-auto p-4">
      <header class="mb-4">
        <h1 class="text-xl font-semibold text-gray-900">Moyens de paiement</h1>
        <p class="text-sm text-gray-500">
          Seules les métadonnées (marque, 4 derniers chiffres, expiration) sont stockées côté client.
        </p>
      </header>

      <!-- Liste -->
      <div class="grid gap-3 mb-6">
        <div *ngFor="let p of list(); trackBy: trackById"
             class="p-4 border rounded-xl bg-white flex items-center justify-between">
          <div class="text-sm">
            <div class="font-medium text-gray-900 uppercase">
              {{ p.brand }} •••• {{ p.last4 }}
              <span *ngIf="p.isDefault"
                    class="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Par défaut
              </span>
            </div>
            <div class="text-gray-600">
              Exp {{ p.expMonth }}/{{ p.expYear }}
              <span *ngIf="p.holder">• {{ p.holder }}</span>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button class="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                    [disabled]="p.isDefault" (click)="makeDefault(p)">
              Définir par défaut
            </button>
            <button class="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                    (click)="remove(p)">
              Supprimer
            </button>
          </div>
        </div>

        <div *ngIf="!list().length"
             class="p-6 border rounded-xl bg-white text-sm text-gray-600">
          Aucun moyen de paiement enregistré.
        </div>
      </div>

      <!-- Formulaire ajout -->
      <form #pmForm="ngForm" (ngSubmit)="add(pmForm)"
            class="p-4 border rounded-xl bg-white grid gap-3" novalidate>
        <div class="text-sm font-medium text-gray-900">Ajouter un moyen de paiement</div>

        <div class="grid sm:grid-cols-5 gap-3">
          <select [(ngModel)]="form.brand" name="brand" class="input" required>
            <option *ngFor="let b of brands" [ngValue]="b">{{ b | titlecase }}</option>
          </select>

          <input [(ngModel)]="form.last4" name="last4" maxlength="4"
                 pattern="\\d{4}" placeholder="4 derniers" class="input" required>

          <input [(ngModel)]="form.expMonth" name="expMonth" type="number"
                 min="1" max="12" placeholder="MM" class="input" required>

          <input [(ngModel)]="form.expYear" name="expYear" type="number"
                 [min]="minYear" [max]="maxYear" placeholder="YYYY" class="input" required>

          <input [(ngModel)]="form.holder" name="holder"
                 placeholder="Titulaire (optionnel)" class="input">
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" class="btn" [disabled]="!pmForm.valid">Ajouter</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .input { @apply w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500; }
    .btn { @apply inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50; }
  `]
})
export class PaymentsComponent {
  private store = inject(PaymentsStore);
  private toast = inject(ToastService);

  // liste réactive depuis le store (signal)
  list = this.store.items;

  // bornes d’année : maintenant → +15 ans
  readonly minYear = new Date().getFullYear();
  readonly maxYear = this.minYear + 15;

  // options de marque via *ngFor
  readonly brands: PaymentBrand[] = ['visa', 'mastercard', 'amex', 'paypal', 'other'];

  form: Omit<PaymentMethod, 'id'> = {
    brand: 'visa',
    last4: '',
    expMonth: 12,
    expYear: this.minYear + 5,
    holder: '',
    isDefault: false,
  };

  trackById = (_: number, p: PaymentMethod) => p.id;

  private resetForm(f: NgForm) {
    f.resetForm({
      brand: 'visa',
      last4: '',
      expMonth: 12,
      expYear: this.minYear + 5,
      holder: '',
      isDefault: false,
    });
  }

  private inputsValid(): boolean {
    const { last4, expMonth, expYear } = this.form;
    return /^\d{4}$/.test(last4)
      && expMonth >= 1 && expMonth <= 12
      && expYear >= this.minYear && expYear <= this.maxYear;
  }

  add(f: NgForm) {
    if (!this.inputsValid()) {
      this.toast.info('Vérifie les 4 chiffres, le mois (1–12) et l’année.');
      return;
    }
    this.store.add({ ...this.form });
    this.resetForm(f);
    this.toast.success('Moyen de paiement ajouté.');
  }

  remove(p: PaymentMethod) {
    this.store.remove(p.id);
    this.toast.info('Moyen de paiement supprimé.');
  }

  makeDefault(p: PaymentMethod) {
    this.store.setDefault(p.id);
    this.toast.success('Défini comme par défaut.');
  }
}
