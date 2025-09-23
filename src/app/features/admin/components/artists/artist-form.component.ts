import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Artist } from '../../../catalog/models/product.model';

interface ArtistFormControls {
  name: FormControl<string>;
  bio: FormControl<string | null>;
  profileImage: FormControl<string | null>;
}
type ArtistFormGroup = FormGroup<ArtistFormControls>;

@Component({
  selector: 'app-artist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6" novalidate>
      <!-- Informations générales -->
      <div class="bg-white/50 rounded-lg p-4 border">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Informations générales</h3>
        <div class="grid grid-cols-1 gap-6">
          <!-- Nom -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'artiste <span class="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="isInvalid('name')"
              placeholder="Nom complet de l'artiste"
            />
            <p *ngIf="isInvalid('name')" class="text-sm text-red-600 mt-1">
              Le nom est requis (2 à 80 caractères).
            </p>
          </div>

          <!-- Biographie -->
          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
              Biographie
            </label>
            <textarea
              id="bio"
              formControlName="bio"
              rows="4"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Décrivez le parcours et le style de l'artiste..."
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">Optionnel - Présentez l'artiste et son travail</p>
          </div>
        </div>
      </div>

      <!-- Image de profil -->
      <div class="bg-white/50 rounded-lg p-4 border">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Image de profil</h3>

        <!-- Preview actuelle -->
        @if (form.controls.profileImage.value) {
          <div class="mb-4">
            <p class="text-xs text-gray-600 mb-2">Aperçu actuel :</p>
            <img
              [src]="form.controls.profileImage.value"
              alt="Aperçu du profil"
              class="w-20 h-20 rounded-lg object-cover border shadow-sm"
            />
          </div>
        }

        <!-- Zone de drop -->
        <div
          class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition p-6 text-center cursor-pointer"
          (click)="triggerFilePicker()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
          role="button"
          aria-label="Importer une image de profil"
          tabindex="0"
        >
          <div class="flex flex-col items-center gap-2">
            <i class="fa-regular fa-user text-2xl text-gray-500"></i>
            <div class="text-sm text-gray-600">
              Glissez-déposez une image ici <span class="text-gray-400">ou</span>
              <span class="text-blue-600 underline">sélectionnez-la</span>
            </div>
            <div class="text-xs text-gray-400">PNG, JPG — jusqu'à 5 Mo</div>
          </div>
          <input #fileInput type="file" accept="image/*" class="hidden" (change)="onPick($event)" />
        </div>

        <div class="flex items-center gap-3 mt-3">
          <button
            type="button"
            (click)="triggerFilePicker()"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <i class="fa-solid fa-upload text-sm"></i>
            Depuis l'ordinateur
          </button>
          <button
            type="button"
            (click)="addImageByUrl()"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <i class="fa-solid fa-link text-sm"></i>
            URL
          </button>
          @if (form.controls.profileImage.value) {
            <button
              type="button"
              (click)="removeImage()"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              <i class="fa-solid fa-trash text-sm"></i>
              Supprimer
            </button>
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          (click)="formCancel.emit()"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <i class="fa-solid fa-times text-sm"></i>
          Annuler
        </button>
        <button
          type="submit"
          [disabled]="form.invalid || submitting"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i
            class="fa-solid fa-save text-sm"
            [class.fa-spinner]="submitting"
            [class.fa-spin]="submitting"
          ></i>
          {{ submitLabel || 'Enregistrer' }}
        </button>
      </div>
    </form>
  `,
})
export class ArtistFormComponent {
  private readonly fb = inject(FormBuilder);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() set initial(value: Artist | null | undefined) {
    if (!value) {
      this.form.reset();
      return;
    }
    this.form.reset({
      name: value.name,
      bio: value.bio ?? null,
      profileImage: value.profileImage ?? null,
    });
  }

  @Input() submitLabel?: string;

  @Output() save = new EventEmitter<Omit<Artist, 'id'>>();
  @Output() formCancel = new EventEmitter<void>();

  submitting = false;

  form: ArtistFormGroup = this.fb.group<ArtistFormControls>({
    name: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    bio: this.fb.control<string | null>(null),
    profileImage: this.fb.control<string | null>(null),
  });

  isInvalid<K extends keyof ArtistFormControls>(ctrl: K): boolean {
    const c = this.form.get(ctrl as string);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // Image handling…
  triggerFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  addImageByUrl(): void {
    const url = prompt('URL de l' + 'image (https:// ou data:image/...)') ?? '';
    const clean = url.trim();
    if (!clean) return;

    const ok = /^https?:\/\/.+/i.test(clean) || /^data:image\//i.test(clean);
    if (!ok) {
      alert('URL invalide. Utilisez une URL commençant par https:// ou data:image/');
      return;
    }

    this.form.controls.profileImage.setValue(clean);
    this.form.controls.profileImage.markAsTouched();
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;

    const file = dt.files[0];
    if (!file.type.startsWith('image/')) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    const dataUrl = await this.readAsDataURL(file);
    this.form.controls.profileImage.setValue(dataUrl);
    this.form.controls.profileImage.markAsTouched();
  }

  async onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    const dataUrl = await this.readAsDataURL(file);
    this.form.controls.profileImage.setValue(dataUrl);
    this.form.controls.profileImage.markAsTouched();
    input.value = '';
  }

  removeImage(): void {
    this.form.controls.profileImage.setValue(null);
    this.form.controls.profileImage.markAsTouched();
  }

  private readAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onerror = () => rej(reader.error);
      reader.onload = () => res(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.getRawValue();

    this.save.emit({
      name: v.name,
      bio: v.bio ?? undefined,
      profileImage: v.profileImage ?? undefined,
    });

    this.submitting = false;
  }
}
