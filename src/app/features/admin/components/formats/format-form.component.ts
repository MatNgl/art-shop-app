// src/app/features/admin/components/formats/format-form.component.ts
import { Component, EventEmitter, Input, Output, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { PrintFormat, Unit } from '../../../../features/catalog/models/print-format.model';

@Component({
  selector: 'app-format-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [
    `
      :host {
        --ff-sticky-top: 76px;
      }
      .ff-form {
        position: relative;
      }
      .ff-progress-sticky {
        position: sticky;
        top: var(--ff-sticky-top);
        z-index: 10;
      }
      .ff-progress-sticky [role='progressbar'] > div {
        transition: width 180ms ease, background-color 180ms ease;
      }
    `,
  ],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="ff-form space-y-6 mx-auto max-w-4xl px-4"
      novalidate
    >
      <!-- Progress (PAS de bandeau héro ici pour éviter le doublon avec la page) -->
      <div
        class="ff-progress-sticky bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 shadow-sm rounded-2xl"
        role="region"
        aria-label="Préparation du format"
      >
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              <i class="fa-solid fa-gauge-high text-indigo-600 mr-1"></i>
              Préparation du format
            </span>
            <div class="flex items-center gap-3">
              <span
                class="text-sm font-semibold"
                [class.text-green-600]="readyToPost()"
                [class.text-indigo-600]="!readyToPost()"
              >
                {{ progress() }}%
              </span>
              <button
                type="button"
                (click)="detailsOpen.set(!detailsOpen())"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                [attr.aria-expanded]="detailsOpen()"
                aria-controls="ff-progress-details"
              >
                <i
                  class="fa-solid"
                  [class.fa-chevron-down]="!detailsOpen()"
                  [class.fa-chevron-up]="detailsOpen()"
                ></i>
                Détails
              </button>
            </div>
          </div>

          <div
            class="h-3 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="progress()"
          >
            <div
              class="h-full transition-all"
              [class.bg-green-500]="readyToPost()"
              [class.bg-indigo-500]="!readyToPost()"
              [style.width.%]="progress()"
            ></div>
          </div>

          <div class="mt-2 flex items-start justify-between">
            <p
              class="text-xs"
              [class.text-green-700]="readyToPost()"
              [class.text-gray-500]="!readyToPost()"
            >
              @if (readyToPost()) { Prêt à être posté 🎉 } @else { Complétez les champs requis pour
              atteindre 100%. }
            </p>
            <span class="text-xs text-gray-600 font-medium">
              {{ checklistDoneCount() }}/{{ checklistTotalCount() }}
            </span>
          </div>

          @if (detailsOpen()) {
          <div id="ff-progress-details" class="mt-3 border-t pt-3">
            <ul class="grid grid-cols-2 md:grid-cols-4 gap-2">
              @for (item of checklist(); track item.key) {
              <li
                class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                [class.border-green-200]="item.done"
                [class.bg-green-50]="item.done"
                [class.border-gray-200]="!item.done"
                [class.bg-gray-50]="!item.done"
              >
                <i
                  class="fa-solid text-xs"
                  [class.fa-check]="item.done"
                  [class.fa-xmark]="!item.done"
                  [class.text-green-600]="item.done"
                  [class.text-gray-500]="!item.done"
                ></i>
                <span class="text-xs text-gray-800">
                  {{ item.label }}
                  @if (item.optional) {
                  <span class="text-[10px] text-gray-500">(optionnel)</span>
                  }
                </span>
              </li>
              }
            </ul>
          </div>
          }
        </div>
      </div>

      <!-- Carte: informations principales -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-ruler-combined text-xl text-white"></i>
            </div>
            <h3 class="text-lg font-bold text-white">Informations du format</h3>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-tag text-indigo-500"></i>
                Nom *
              </span>
              <input
                type="text"
                formControlName="name"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="Ex: Marque-page"
                (input)="onNameChange()"
              />
              @if (isInvalid('name')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i> Nom requis (2–80)
              </p>
              }
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-link text-indigo-500"></i>
                Slug (URL)
              </span>
              <input
                type="text"
                formControlName="slug"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono text-sm"
                placeholder="marque-page"
              />
              <p class="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-lightbulb"></i> Généré automatiquement, modifiable.
              </p>
              @if (isInvalid('slug')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i> Slug requis (2–80)
              </p>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <span class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-arrows-left-right text-purple-500"></i> Largeur *
              </span>
              <input
                type="number"
                formControlName="width"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
            <div>
              <span class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-arrows-up-down text-purple-500"></i> Hauteur *
              </span>
              <input
                type="number"
                formControlName="height"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
            <div>
              <span class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-ruler text-purple-500"></i> Unité *
              </span>
              <select
                formControlName="unit"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">inches</option>
              </select>
            </div>
            <div class="flex items-end">
              <div class="w-full">
                <span class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-eye text-emerald-500"></i> Statut
                </span>
                <label
                  class="inline-flex items-center gap-3 px-3 py-2 bg-white rounded-lg border-2 cursor-pointer group w-full"
                  [class.border-green-500]="form.controls.isActive.value"
                  [class.bg-green-50]="form.controls.isActive.value"
                  [class.border-gray-200]="!form.controls.isActive.value"
                >
                  <div class="relative">
                    <input
                      type="checkbox"
                      formControlName="isActive"
                      class="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 transition-all"
                    />
                    <i
                      class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
                    ></i>
                  </div>
                  <span class="text-sm font-medium">Actif</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i class="fa-solid fa-align-left text-indigo-500"></i> Description
            </span>
            <textarea
              rows="3"
              formControlName="description"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              placeholder="(optionnel)"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Aperçu -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-eye text-xl text-white"></i>
            </div>
            <h3 class="text-lg font-bold text-white">Aperçu</h3>
          </div>
        </div>
        <div class="p-6 space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-700 min-w-[120px]">
              <i class="fa-solid fa-link text-purple-500 mr-2"></i>Slug :
            </span>
            <code
              class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-mono border border-purple-200"
            >
              {{ form.controls.slug.value || '—' }}
            </code>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-700 min-w-[120px]">
              <i class="fa-solid fa-ruler-combined text-purple-500 mr-2"></i>Dimensions :
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-gray-50 border text-gray-700 border-gray-200">
              {{ form.controls.width.value || 0 }} × {{ form.controls.height.value || 0 }}
              {{ form.controls.unit.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 -mx-6 -mb-6 rounded-b-2xl shadow-2xl"
      >
        <div class="flex justify-between items-center gap-4">
          <div class="text-sm text-gray-600">
            <i class="fa-solid fa-info-circle text-gray-400 mr-1"></i>
            Les modifications seront enregistrées dans la base de données
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              (click)="formCancel.emit()"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              <i class="fa-solid fa-times"></i> Annuler
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              [class.bg-gradient-to-r]="!form.invalid && !submitting()"
              [class.from-green-500]="!form.invalid && !submitting()"
              [class.to-emerald-600]="!form.invalid && !submitting()"
              [class.hover:from-green-600]="!form.invalid && !submitting()"
              [class.hover:to-emerald-700]="!form.invalid && !submitting()"
              [class.bg-gray-300]="form.invalid || submitting()"
            >
              <i
                class="fa-solid"
                [class.fa-save]="!submitting()"
                [class.fa-spinner]="submitting()"
                [class.fa-spin]="submitting()"
              ></i>
              {{ submitting() ? 'Enregistrement...' : submitLabel }}
            </button>
          </div>
        </div>
      </div>
    </form>
  `,
})
export class FormatFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() initial?: PrintFormat | null;
  @Input() submitLabel = 'Enregistrer';
  @Output() save = new EventEmitter<Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>>();
  @Output() formCancel = new EventEmitter<void>();

  detailsOpen = signal(false);
  submitting = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    slug: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    width: this.fb.nonNullable.control(0, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    height: this.fb.nonNullable.control(0, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    unit: this.fb.nonNullable.control<Unit>('cm'),
    isActive: this.fb.nonNullable.control(true),
    description: this.fb.nonNullable.control<string>(''),
  });

  ngOnChanges(): void {
    if (this.initial) {
      const { name, slug, width, height, unit, isActive, description } = this.initial;
      this.form.setValue({
        name,
        slug,
        width,
        height,
        unit,
        isActive,
        description: description ?? '',
      });
    } else {
      this.form.reset({
        name: '',
        slug: '',
        width: 0,
        height: 0,
        unit: 'cm',
        isActive: true,
        description: '',
      });
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.save.emit(this.form.getRawValue());
    this.submitting.set(false);
  }

  onNameChange(): void {
    if (this.initial) return; // édition libre en mode edit
    const name = this.form.controls.name.value;
    if (!this.form.controls.slug.value || this.form.controls.slug.value.length < 2) {
      const s = (name || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      this.form.controls.slug.setValue(s);
    }
  }

  isInvalid(controlName: keyof FormatFormComponent['form']['controls']): boolean {
    const c = this.form.controls[controlName];
    return c.invalid && (c.dirty || c.touched);
  }

  checklist() {
    const f = this.form.controls;
    return [
      { key: 'name', label: 'Nom', done: f.name.valid },
      { key: 'slug', label: 'Slug', done: f.slug.valid },
      { key: 'width', label: 'Largeur', done: f.width.valid },
      { key: 'height', label: 'Hauteur', done: f.height.valid },
      { key: 'unit', label: 'Unité', done: f.unit.valid },
      {
        key: 'description',
        label: 'Description',
        done: !!f.description.value?.trim(),
        optional: true,
      },
      { key: 'isActive', label: 'Statut', done: true, optional: true },
    ] as { key: string; label: string; done: boolean; optional?: boolean }[];
  }
  checklistDoneCount(): number {
    return this.checklist().filter((i) => i.done).length;
  }
  checklistTotalCount(): number {
    return this.checklist().length;
  }
  progress(): number {
    const checks = [
      this.form.controls.name.valid,
      this.form.controls.slug.valid,
      this.form.controls.width.valid,
      this.form.controls.height.valid,
      this.form.controls.unit.valid,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }
  readyToPost(): boolean {
    return this.progress() === 100;
  }
}
