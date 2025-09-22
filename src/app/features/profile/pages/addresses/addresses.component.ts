import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AddressesStore, Address } from '../../../profile/services/addresses-store';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-profile-addresses',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="max-w-3xl mx-auto p-4">
      <header class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Mes adresses</h1>
        <span class="text-sm text-gray-500">{{ count() }} / {{ max }}</span>
      </header>

      <!-- Liste -->
      <div class="grid gap-3 mb-6">
        <div *ngFor="let a of list()" class="p-4 border rounded-xl bg-white flex items-start justify-between">
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-900">
              {{ a.label || 'Adresse' }}
              <span *ngIf="a.isDefault" class="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Par défaut</span>
            </div>
            <div class="text-sm text-gray-700 truncate">
              {{ a.street }}, {{ a.postalCode }} {{ a.city }}, {{ a.country }}
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              class="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              [disabled]="a.isDefault"
              (click)="makeDefault(a)">
              Définir par défaut
            </button>
            <button
              class="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
              (click)="remove(a)">
              Supprimer
            </button>
          </div>
        </div>

        <div *ngIf="!list().length" class="p-6 border rounded-xl bg-white text-sm text-gray-600">
          Aucune adresse enregistrée. Ajoute ta première adresse ci-dessous.
        </div>
      </div>

      <!-- Formulaire ajout -->
      <form #addrForm="ngForm" (ngSubmit)="add(addrForm)" class="p-4 border rounded-xl bg-white grid gap-3">
        <div class="text-sm font-medium text-gray-900">Ajouter une adresse</div>

        <div class="grid sm:grid-cols-2 gap-3">
          <input [(ngModel)]="form.label" name="label" placeholder="Libellé (Domicile, Bureau)" class="input">
          <input [(ngModel)]="form.street" name="street" required placeholder="Rue" class="input">
          <input [(ngModel)]="form.postalCode" name="postalCode" required placeholder="Code postal" class="input">
          <input [(ngModel)]="form.city" name="city" required placeholder="Ville" class="input">
          <input [(ngModel)]="form.country" name="country" required placeholder="Pays" class="input sm:col-span-2">
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" class="btn" [disabled]="count()>=max || !addrForm.valid">Ajouter</button>
          <span *ngIf="count()>=max" class="text-xs text-amber-600">Vous avez atteint la limite de {{ max }} adresses.</span>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .input { @apply w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500; }
    .btn { @apply inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50; }
  `]
})
export class AddressesComponent {
  private store = inject(AddressesStore);
  private toast = inject(ToastService);

  list = this.store.items;
  count = this.store.count;
  max = this.store.max;

  form: Omit<Address, 'id'> = {
    label: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    isDefault: false,
  };

  add(f: NgForm) {
    try {
      this.store.add(this.form);
      f.resetForm({ label: '', street: '', city: '', postalCode: '', country: '', isDefault: false });
      this.toast.success('Adresse ajoutée.');
    } catch {
      this.toast.info('Vous avez atteint la limite de 3 adresses.');
    }
  }
  remove(a: Address) {
    this.store.remove(a.id);
    this.toast.info('Adresse supprimée.');
  }
  makeDefault(a: Address) {
    this.store.setDefault(a.id);
    this.toast.success('Adresse définie par défaut.');
  }
}
