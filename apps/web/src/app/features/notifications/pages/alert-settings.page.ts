import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertSettings, DEFAULT_ALERT_SETTINGS } from '../models/alert-settings.model';
import { ToastService } from '../../../shared/services/toast.service';

const STORAGE_KEY = 'admin_alert_settings';

@Component({
  selector: 'app-alert-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-2">
            <a
              routerLink="/admin/notifications"
              class="text-gray-400 hover:text-gray-600"
              title="Retour aux notifications"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </a>
            <h1 class="text-3xl font-bold text-gray-900">Paramètres des alertes</h1>
          </div>
          <p class="text-sm text-gray-600">
            Configurez les types d'alertes et les seuils de déclenchement
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Types d'alertes -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              <i class="fa-solid fa-toggle-on text-blue-600 mr-2"></i>
              Types d'alertes
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Activez ou désactivez les types d'alertes que vous souhaitez recevoir
            </p>

            <div class="space-y-3">
              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="out_of_stock"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Rupture de stock</div>
                  <div class="text-sm text-gray-500">Produits avec 0 unité en stock</div>
                </div>
                <span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Critique
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="low_stock"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Stock faible</div>
                  <div class="text-sm text-gray-500">Produits avec moins de {{ form.value.stockMinimum }} unités</div>
                </div>
                <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Avertissement
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="new_order"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Nouvelle commande</div>
                  <div class="text-sm text-gray-500">Notification pour chaque nouvelle commande</div>
                </div>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Info
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="new_subscription"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Nouvel abonnement</div>
                  <div class="text-sm text-gray-500">Notification pour chaque nouvel abonnement</div>
                </div>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Info
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="pending_orders"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Commandes en attente</div>
                  <div class="text-sm text-gray-500">Commandes en attente depuis plus de {{ form.value.hoursOrderPending }}h</div>
                </div>
                <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Avertissement
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="box_to_prepare"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Box mensuelles à préparer</div>
                  <div class="text-sm text-gray-500">Alertes pour les box en attente de préparation</div>
                </div>
                <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Avertissement
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="payment_failed"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Échecs de paiement</div>
                  <div class="text-sm text-gray-500">Alertes pour les paiements d'abonnement échoués</div>
                </div>
                <span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Critique
                </span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="new_user"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">Nouveau compte utilisateur</div>
                  <div class="text-sm text-gray-500">Notification pour chaque inscription</div>
                </div>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Info
                </span>
              </label>
            </div>
          </div>

          <!-- Seuils -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              <i class="fa-solid fa-sliders text-blue-600 mr-2"></i>
              Seuils d'alerte
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Définissez les valeurs de déclenchement des alertes
            </p>

            <div class="space-y-4">
              <div>
                <label for="stockMin" class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fa-solid fa-box mr-1"></i>
                  Stock minimum (unités)
                </label>
                <input
                  id="stockMin"
                  type="number"
                  formControlName="stockMinimum"
                  min="1"
                  max="100"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Alerte "Stock faible" si le stock est inférieur à cette valeur
                </p>
                @if (form.get('stockMinimum')?.invalid && form.get('stockMinimum')?.touched) {
                  <p class="mt-1 text-xs text-red-600">
                    La valeur doit être entre 1 et 100
                  </p>
                }
              </div>

              <div>
                <label for="daysNoSale" class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fa-solid fa-calendar mr-1"></i>
                  Jours sans vente
                </label>
                <input
                  id="daysNoSale"
                  type="number"
                  formControlName="daysWithoutSale"
                  min="1"
                  max="365"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Alerte si un produit n'a pas été vendu depuis X jours (fonctionnalité à venir)
                </p>
                @if (form.get('daysWithoutSale')?.invalid && form.get('daysWithoutSale')?.touched) {
                  <p class="mt-1 text-xs text-red-600">
                    La valeur doit être entre 1 et 365
                  </p>
                }
              </div>

              <div>
                <label for="hoursPending" class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fa-solid fa-clock mr-1"></i>
                  Heures commande en attente
                </label>
                <input
                  id="hoursPending"
                  type="number"
                  formControlName="hoursOrderPending"
                  min="1"
                  max="168"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="48"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Alerte si une commande est en attente depuis plus de X heures (fonctionnalité à venir)
                </p>
                @if (form.get('hoursOrderPending')?.invalid && form.get('hoursOrderPending')?.touched) {
                  <p class="mt-1 text-xs text-red-600">
                    La valeur doit être entre 1 et 168 (7 jours)
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- Options supplémentaires -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              <i class="fa-solid fa-gear text-blue-600 mr-2"></i>
              Options supplémentaires
            </h2>

            <div class="space-y-3">
              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="soundEnabled"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    <i class="fa-solid fa-volume-high mr-2"></i>
                    Notifications sonores
                  </div>
                  <div class="text-sm text-gray-500">Émettre un son pour les alertes critiques</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="emailNotifications"
                  class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    <i class="fa-solid fa-envelope mr-2"></i>
                    Notifications par email
                  </div>
                  <div class="text-sm text-gray-500">Recevoir les alertes par email (fonctionnalité à venir)</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between bg-white rounded-lg shadow p-6">
            <button
              type="button"
              (click)="resetToDefaults()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <i class="fa-solid fa-rotate-left mr-2"></i>
              Réinitialiser
            </button>

            <div class="flex items-center gap-3">
              <a
                routerLink="/admin/notifications"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </a>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (saving()) {
                  <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                  Enregistrement...
                } @else {
                  <i class="fa-solid fa-check mr-2"></i>
                  Enregistrer
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [],
})
export class AlertSettingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  saving = signal(false);

  form = this.fb.group({
    // Types d'alertes
    out_of_stock: [true],
    low_stock: [true],
    new_order: [true],
    new_subscription: [true],
    pending_orders: [true],
    box_to_prepare: [true],
    payment_failed: [true],
    new_user: [true],

    // Seuils
    stockMinimum: [5, [Validators.required, Validators.min(1), Validators.max(100)]],
    daysWithoutSale: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
    hoursOrderPending: [48, [Validators.required, Validators.min(1), Validators.max(168)]],

    // Options
    soundEnabled: [false],
    emailNotifications: [false],
  });

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: AlertSettings = JSON.parse(stored);
        this.form.patchValue({
          ...settings.enabledTypes,
          ...settings.thresholds,
          soundEnabled: settings.soundEnabled,
          emailNotifications: settings.emailNotifications,
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const values = this.form.value;
    const settings: AlertSettings = {
      enabledTypes: {
        out_of_stock: values.out_of_stock ?? true,
        low_stock: values.low_stock ?? true,
        new_order: values.new_order ?? true,
        new_subscription: values.new_subscription ?? true,
        pending_orders: values.pending_orders ?? true,
        box_to_prepare: values.box_to_prepare ?? true,
        payment_failed: values.payment_failed ?? true,
        new_user: values.new_user ?? true,
      },
      thresholds: {
        stockMinimum: values.stockMinimum ?? 5,
        daysWithoutSale: values.daysWithoutSale ?? 30,
        hoursOrderPending: values.hoursOrderPending ?? 48,
      },
      soundEnabled: values.soundEnabled ?? false,
      emailNotifications: values.emailNotifications ?? false,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setTimeout(() => {
        this.saving.set(false);
        this.toast.success('Paramètres enregistrés avec succès');
      }, 500);
    } catch (error) {
      this.saving.set(false);
      this.toast.error('Erreur lors de l\'enregistrement des paramètres');
      console.error(error);
    }
  }

  resetToDefaults(): void {
    this.form.patchValue({
      ...DEFAULT_ALERT_SETTINGS.enabledTypes,
      ...DEFAULT_ALERT_SETTINGS.thresholds,
      soundEnabled: DEFAULT_ALERT_SETTINGS.soundEnabled,
      emailNotifications: DEFAULT_ALERT_SETTINGS.emailNotifications,
    });
    this.toast.info('Paramètres réinitialisés aux valeurs par défaut');
  }
}
