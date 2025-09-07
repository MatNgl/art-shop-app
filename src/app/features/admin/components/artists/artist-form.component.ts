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
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Header du formulaire -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ initial ? 'Modifier artiste' : 'Nouvel artiste' }}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          {{
            initial
              ? 'Mettez à jour les informations de l ' + 'artiste'
              : 'Ajoutez un nouvel artiste à la base de données'
          }}
        </p>
      </div>

      <!-- Formulaire -->
      <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-6" novalidate>
        <!-- Nom de l'artiste -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'artiste <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Nom complet de l'artiste"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            [class.border-red-500]="isInvalid('name')"
          />
          <div *ngIf="isInvalid('name')" class="mt-1 text-sm text-red-600">
            <span *ngIf="form.controls.name.hasError('required')">Le nom est requis.</span>
            <span *ngIf="form.controls.name.hasError('minlength')">
              Le nom doit contenir au moins 2 caractères.
            </span>
            <span *ngIf="form.controls.name.hasError('maxlength')">
              Le nom ne peut pas dépasser 80 caractères.
            </span>
          </div>
        </div>

        <!-- Biographie -->
        <div>
          <label for="bio" class="block text-sm font-medium text-gray-700 mb-2"> Biographie </label>
          <textarea
            id="bio"
            formControlName="bio"
            rows="4"
            placeholder="Description de l'artiste, son parcours, son style..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">Optionnel - Décrivez l'artiste et son travail</p>
        </div>

        <!-- Photo de profil -->
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-2">Photo de profil</span>

          <!-- Prévisualisation de l'image actuelle -->
          <div *ngIf="form.controls.profileImage.value" class="mb-4">
            <div class="flex items-center gap-4">
              <img
                [src]="form.controls.profileImage.value"
                alt="Aperçu"
                class="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
              <div>
                <p class="text-sm text-gray-700">Image actuelle</p>
                <button
                  type="button"
                  (click)="removeImage()"
                  class="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <!-- Zone d'upload -->
          <div
            class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors p-6 text-center cursor-pointer"
            (click)="triggerFilePicker()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            role="button"
            tabindex="0"
            aria-label="Importer une photo de profil"
          >
            <div class="flex flex-col items-center gap-2">
              <i class="fa-regular fa-user text-2xl text-gray-500"></i>
              <div class="text-sm text-gray-600">
                Glissez-déposez une photo ici <span class="text-gray-400">ou</span>
                <span class="text-blue-600 underline">sélectionnez un fichier</span>
              </div>
              <div class="text-xs text-gray-400">PNG, JPG — jusqu'à 5 Mo</div>
            </div>
            <input
              #fileInput
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </div>

          <!-- Ou par URL -->
          <div class="mt-3">
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500">ou</span>
              <button
                type="button"
                (click)="addImageByUrl()"
                class="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Ajouter par URL
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            (click)="formCancel.emit()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
            Annuler
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || submitting"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fa-solid fa-check text-sm" *ngIf="!submitting"></i>
            <i class="fa-solid fa-spinner fa-spin text-sm" *ngIf="submitting"></i>
            @if (submitting) { Enregistrement... } @else if (_initial) { Mettre à jour } @else {
            Créer l'artiste }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ArtistFormComponent {
  private readonly fb = inject(FormBuilder);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // Variable interne pour stocker la valeur initial
  _initial: Artist | null = null;

  @Input() set initial(value: Artist | null | undefined) {
    this._initial = value || null;
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

  get initial(): Artist | null {
    return this._initial;
  }

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

  isInvalid(controlName: keyof ArtistFormControls): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  triggerFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  removeImage(): void {
    this.form.controls.profileImage.setValue(null);
    this.form.controls.profileImage.markAsTouched();
  }

  addImageByUrl(): void {
    const url = prompt('URL de l' + 'image de profil (https://...)') ?? '';
    const clean = url.trim();
    if (!clean) return;

    const isValid = /^https?:\/\/.+/i.test(clean) || /^data:image\//i.test(clean);
    if (!isValid) {
      alert('Veuillez entrer une URL valide (commençant par https://)');
      return;
    }

    this.form.controls.profileImage.setValue(clean);
    this.form.controls.profileImage.markAsTouched();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      alert('Le fichier est trop volumineux (max 5 Mo)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    try {
      const dataUrl = await this.readAsDataURL(file);
      this.form.controls.profileImage.setValue(dataUrl);
      this.form.controls.profileImage.markAsTouched();
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier :', error);
      alert('Erreur lors de la lecture du fichier');
    }

    // Reset input
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      alert('Veuillez déposer un fichier image');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      alert('Le fichier est trop volumineux (max 5 Mo)');
      return;
    }

    try {
      const dataUrl = await this.readAsDataURL(file);
      this.form.controls.profileImage.setValue(dataUrl);
      this.form.controls.profileImage.markAsTouched();
    } catch (error) {
      console.error('Erreur lors du drop/lecture du fichier :', error);
      alert('Erreur lors de la lecture du fichier');
    }
  }

  private readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const values = this.form.getRawValue();

    const payload: Omit<Artist, 'id'> = {
      name: values.name,
      bio: values.bio || undefined,
      profileImage: values.profileImage || undefined,
    };

    this.save.emit(payload);

    // Reset submitting after a delay to show feedback
    setTimeout(() => {
      this.submitting = false;
    }, 500);
  }
}
