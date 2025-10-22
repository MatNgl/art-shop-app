import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PlanCreate, LoyaltyMultiplier } from '../../subscriptions/models/subscription.model';

@Component({
  selector: 'app-subscription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      <!-- Header avec dégradé purple -->
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-purple-100 mb-4 flex items-center gap-2">
            <a
              routerLink="/admin/dashboard"
              class="hover:text-white transition-colors flex items-center gap-1"
            >
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/subscriptions" class="hover:text-white transition-colors">
              Abonnements
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">{{ isEditMode() ? 'Modifier' : 'Nouveau' }}</span>
          </nav>

          <!-- Titre avec icône -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <i
                class="fa-solid {{
                  isEditMode() ? 'fa-pen-to-square' : 'fa-plus'
                }} text-3xl text-white"
              ></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">
                {{ isEditMode() ? 'Modifier le plan' : 'Nouveau plan d'abonnement' }}
              </h1>
              <p class="text-purple-100">
                {{ isEditMode() ? 'Modifiez les paramètres de votre plan' : 'Créez un nouveau plan pour vos clients' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Barre de progression sticky -->
          <div
            class="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 shadow-sm rounded-2xl sticky top-4 z-10"
          >
            <div class="px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  <i class="fa-solid fa-gauge-high text-purple-600 mr-1"></i>
                  Préparation du plan
                </span>
                <span
                  class="text-sm font-semibold"
                  [class.text-green-600]="progress() === 100"
                  [class.text-purple-600]="progress() !== 100"
                >
                  {{ progress() }}%
                </span>
              </div>
              <div
                class="h-3 bg-gray-200 rounded-full overflow-hidden mb-3"
                role="progressbar"
                [attr.aria-valuenow]="progress()"
              >
                <div
                  class="h-full transition-all"
                  [class.bg-green-500]="progress() === 100"
                  [class.bg-purple-500]="progress() !== 100"
                  [ngStyle]="{ width: progress() + '%' }"
                ></div>
              </div>

              <!-- Liste des champs requis -->
              <div class="flex flex-wrap gap-2">
                @for (field of fieldStatuses(); track field.name) {
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                    [class.bg-green-100]="field.valid"
                    [class.text-green-700]="field.valid"
                    [class.bg-gray-100]="!field.valid"
                    [class.text-gray-500]="!field.valid"
                  >
                    <i
                      class="fa-solid"
                      [class.fa-check]="field.valid"
                      [class.fa-circle]="!field.valid"
                      [class.text-[8px]]="!field.valid"
                    ></i>
                    {{ field.label }}
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Informations générales -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-info-circle text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Informations générales</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <!-- Nom -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-tag text-purple-500"></i>
                  Nom du plan <span class="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Ex: Starter, Plus, Pro"
                />
              </div>

              <!-- Slug -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-link text-purple-500"></i>
                  Slug (identifiant unique) <span class="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  formControlName="slug"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-mono"
                  placeholder="ex: starter, plus, pro"
                />
                <p class="text-xs text-gray-500 mt-1">Format kebab-case (minuscules et tirets)</p>
              </div>

              <!-- Description -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-align-left text-purple-500"></i>
                  Description
                </span>
                <textarea
                  formControlName="description"
                  rows="3"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  placeholder="Description courte du plan"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Tarification -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-euro-sign text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Tarification</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-calendar text-green-500"></i>
                    Prix mensuel (€) <span class="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    formControlName="monthlyPrice"
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="9.99"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-calendar-check text-green-500"></i>
                    Prix annuel (€) <span class="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    formControlName="annualPrice"
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="99.00"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-gift text-green-500"></i>
                    Mois offerts (annuel)
                  </span>
                  <input
                    type="number"
                    formControlName="monthsOfferedOnAnnual"
                    min="0"
                    max="12"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="0"
                  />
                  <p class="text-xs text-gray-500 mt-1">Ex: 2 = "12 mois pour le prix de 10"</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Fidélité -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-star text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Avantages fidélité</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-multiply text-amber-500"></i>
                    Multiplicateur de points <span class="text-red-500">*</span>
                  </span>
                  <select
                    formControlName="loyaltyMultiplier"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    <option [value]="1.1">1.1× (10% bonus)</option>
                    <option [value]="1.2">1.2× (20% bonus)</option>
                    <option [value]="1.5">1.5× (50% bonus)</option>
                  </select>
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-chart-line text-amber-500"></i>
                    Cap mensuel de points bonus
                  </span>
                  <input
                    type="number"
                    formControlName="monthlyPointsCap"
                    min="0"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    placeholder="0 = illimité"
                  />
                  <p class="text-xs text-gray-500 mt-1">0 = pas de limite</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Avantages -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-list-check text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Avantages détaillés</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-align-left text-blue-500"></i>
                  Liste des avantages (un par ligne)
                </span>
                <textarea
                  formControlName="perksFull"
                  rows="6"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none font-mono text-sm"
                  placeholder="Accès prioritaire&#10;Support 24/7&#10;Livraison offerte&#10;Points fidélité ×1.2"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">Un avantage par ligne</p>
              </div>
            </div>
          </div>

          <!-- Configuration -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-cog text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Configuration</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-arrow-up-1-9 text-gray-600"></i>
                    Ordre d'affichage
                  </span>
                  <input
                    type="number"
                    formControlName="displayOrder"
                    min="0"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder="0"
                  />
                  <p class="text-xs text-gray-500 mt-1">Plus petit = affiché en premier</p>
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-eye text-gray-600"></i>
                    Visibilité
                  </span>
                  <select
                    formControlName="visibility"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    <option value="public">Public (visible par tous)</option>
                    <option value="admin">Admin uniquement</option>
                  </select>
                </div>
              </div>

              <label
                class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
              >
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="w-6 h-6 text-purple-600 border-gray-300 rounded-lg focus:ring-purple-500"
                />
                <div>
                  <div class="font-semibold text-gray-900">Activer ce plan</div>
                  <div class="text-sm text-gray-500 mt-0.5">
                    Le plan sera proposé aux utilisateurs
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Actions sticky -->
          <div
            class="sticky bottom-0 bg-white/95 backdrop-blur border-t-2 border-gray-200 px-6 py-4 -mx-4 rounded-b-2xl shadow-2xl"
          >
            <div class="flex justify-between items-center gap-4">
              <div class="text-sm text-gray-600">
                @if (form.valid) {
                <i class="fa-solid fa-check-circle text-green-600 mr-1"></i>
                Formulaire prêt } @else {
                <i class="fa-solid fa-exclamation-circle text-amber-600 mr-1"></i>
                Vérifiez les champs requis }
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="goBack()"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
                >
                  <i class="fa-solid fa-times"></i>
                  Annuler
                </button>
                <button
                  type="submit"
                  [disabled]="!form.valid"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all border-2 shadow-lg"
                  [class.bg-gradient-to-r]="form.valid"
                  [class.from-purple-600]="form.valid"
                  [class.to-blue-600]="form.valid"
                  [class.text-white]="form.valid"
                  [class.border-transparent]="form.valid"
                  [class.hover:shadow-xl]="form.valid"
                  [class.bg-gray-300]="!form.valid"
                  [class.text-gray-500]="!form.valid"
                  [class.border-gray-300]="!form.valid"
                  [class.cursor-not-allowed]="!form.valid"
                >
                  <i
                    class="fa-solid"
                    [class.fa-save]="!isEditMode()"
                    [class.fa-pen-to-square]="isEditMode()"
                  ></i>
                  {{ isEditMode() ? 'Modifier' : 'Créer' }} le plan
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SubscriptionFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);

  form!: FormGroup;
  isEditMode = signal(false);
  planId = signal<number | null>(null);

  private formStatus = signal<'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'>('INVALID');

  requiredFields = [
    { name: 'name', label: 'Nom' },
    { name: 'slug', label: 'Slug' },
    { name: 'monthlyPrice', label: 'Prix mensuel' },
    { name: 'annualPrice', label: 'Prix annuel' },
    { name: 'loyaltyMultiplier', label: 'Multiplicateur' },
  ];

  totalFields = signal(5);

  fieldStatuses = computed(() => {
    this.formStatus();
    return this.requiredFields.map(field => ({
      ...field,
      valid: this.form?.get(field.name)?.valid ?? false
    }));
  });

  completedFields = computed(() => {
    this.formStatus();
    let count = 0;
    if (this.form?.get('name')?.valid) count++;
    if (this.form?.get('slug')?.valid) count++;
    if (this.form?.get('monthlyPrice')?.valid) count++;
    if (this.form?.get('annualPrice')?.valid) count++;
    if (this.form?.get('loyaltyMultiplier')?.valid) count++;
    return count;
  });

  progress = computed(() => {
    const completed = this.completedFields();
    const total = this.totalFields();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  async ngOnInit(): Promise<void> {
    this.initForm();

    const value$ = this.form.valueChanges.pipe(startWith(this.form.value));
    value$.subscribe(() =>
      this.formStatus.set(this.form.status as 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED')
    );

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.planId.set(parseInt(id, 10));
      await this.loadPlan(parseInt(id, 10));
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      monthlyPrice: [0, [Validators.required, Validators.min(0)]],
      annualPrice: [0, [Validators.required, Validators.min(0)]],
      monthsOfferedOnAnnual: [0, [Validators.min(0), Validators.max(12)]],
      loyaltyMultiplier: [1.1, Validators.required],
      monthlyPointsCap: [0, Validators.min(0)],
      perksFull: [''],
      displayOrder: [0, Validators.min(0)],
      visibility: ['public', Validators.required],
      isActive: [true],
    });
  }

  private async loadPlan(id: number): Promise<void> {
    try {
      const plans = this.subscriptionService.getAllPlans();
      const plan = plans.find(p => p.id === id);
      if (!plan) {
        this.toast.error('Plan introuvable');
        void this.goBack();
        return;
      }

      this.form.patchValue({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        monthsOfferedOnAnnual: plan.monthsOfferedOnAnnual,
        loyaltyMultiplier: plan.loyaltyMultiplier,
        monthlyPointsCap: plan.monthlyPointsCap,
        perksFull: plan.perksFull.join('\n'),
        displayOrder: plan.displayOrder,
        visibility: plan.visibility,
        isActive: plan.isActive,
      });
    } catch {
      this.toast.error('Erreur lors du chargement');
      void this.goBack();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) {
      this.toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.form.value;

    const perksFullArray = (formValue.perksFull || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const input: PlanCreate = {
      name: formValue.name!,
      slug: formValue.slug!,
      description: formValue.description || '',
      monthlyPrice: parseFloat(formValue.monthlyPrice),
      annualPrice: parseFloat(formValue.annualPrice),
      monthsOfferedOnAnnual: parseInt(formValue.monthsOfferedOnAnnual, 10) || 0,
      perksShort: perksFullArray.slice(0, 3),
      perksFull: perksFullArray,
      loyaltyMultiplier: parseFloat(formValue.loyaltyMultiplier) as LoyaltyMultiplier,
      monthlyPointsCap: parseInt(formValue.monthlyPointsCap, 10) || 0,
      visibility: formValue.visibility,
      isActive: !!formValue.isActive,
      deprecated: false,
      displayOrder: parseInt(formValue.displayOrder, 10) || 0,
    };

    try {
      if (this.isEditMode() && this.planId()) {
        const result = this.subscriptionService.updatePlan(this.planId()!, input);
        if (result.success) {
          this.toast.success('Plan modifié avec succès');
          void this.goBack();
        } else {
          this.toast.error(result.error || 'Erreur lors de la modification');
        }
      } else {
        const result = this.subscriptionService.createPlan(input);
        if (result.success) {
          this.toast.success('Plan créé avec succès');
          void this.goBack();
        } else {
          this.toast.error(result.error || 'Erreur lors de la création');
        }
      }
    } catch (err) {
      this.toast.error("Erreur lors de l'enregistrement");
      console.error(err);
    }
  }

  goBack(): void {
    void this.router.navigate(['/admin/subscriptions']);
  }
}
