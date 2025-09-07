import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
      <!-- ...champs... -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          (click)="formCancel.emit()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          [disabled]="form.invalid"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Enregistrer
        </button>
      </div>
    </form>
  `,
})
export class ArtistFormComponent {
  private readonly fb = inject(FormBuilder);

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

  @Output() save = new EventEmitter<Omit<Artist, 'id'>>();
  @Output() formCancel = new EventEmitter<void>(); // ⬅️ renommé

  form: ArtistFormGroup = this.fb.group<ArtistFormControls>({
    name: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    bio: this.fb.control<string | null>(null),
    profileImage: this.fb.control<string | null>(null),
  });

  onUrl(url: string) {
    const clean = (url ?? '').trim();
    if (clean) this.form.controls.profileImage.setValue(clean);
  }

  async onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const dataUrl = await this.readAsDataURL(file);
    this.form.controls.profileImage.setValue(dataUrl);
    input.value = '';
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
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.save.emit({
      name: v.name,
      bio: v.bio ?? undefined,
      profileImage: v.profileImage ?? undefined,
    });
  }
}
