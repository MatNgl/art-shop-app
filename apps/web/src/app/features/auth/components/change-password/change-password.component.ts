import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthHttpService as AuthService } from '../../services/auth-http.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./change-password.component.scss'],
  template: `
    <div class="max-w-xl mx-auto px-4 py-8">
      <h1 class="cp-title">Modifier mon mot de passe</h1>

      <form class="cp-card" [formGroup]="form" (ngSubmit)="save()">
        <!-- Actuel -->
        <div>
          <label class="block text-sm text-gray-600 mb-1" for="current">Mot de passe actuel</label>
          <div class="pw-field">
            <input
              id="current"
              [type]="showCurrent() ? 'text' : 'password'"
              class="input pw-input"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="pw-toggle"
              (click)="toggle('current')"
              aria-label="Afficher/masquer"
            >
              <i class="fa-solid" [ngClass]="showCurrent() ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
          @if (isInvalid('currentPassword')) {
            <div class="field-status field-status--error">
              <i class="fa-solid fa-circle-xmark"></i><span>Requis.</span>
            </div>
          }
        </div>

        <!-- Nouveau mot de passe -->
        <div>
          <label class="block text-sm text-gray-600 mb-1" for="new">Nouveau mot de passe</label>
          <div class="pw-field">
            <input
              id="new"
              [type]="showNew() ? 'text' : 'password'"
              class="input pw-input"
              formControlName="newPassword"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="pw-toggle"
              (click)="toggle('new')"
              aria-label="Afficher/masquer"
            >
              <i class="fa-solid" [ngClass]="showNew() ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
          <p class="helper">Min. 8 caractères, 1 maj, 1 min, 1 chiffre.</p>

          <!-- OK -->
          @if (newPasswordOk()) {
            <div class="field-status field-status--ok">
              <i class="fa-solid fa-circle-check"></i>
              <span>Mot de passe valide</span>
            </div>
          }

          <!-- Erreur: identique à l’actuel -->
          @if (form.errors?.['sameAsCurrent'] && (form.touched || submitted())) {
            <div class="field-status field-status--error">
              <i class="fa-solid fa-circle-xmark"></i>
              <span>Le nouveau mot de passe doit être différent de l’actuel.</span>
            </div>
          }

          <!-- Erreur -->
          @if (isInvalid('newPassword') && !newPasswordOk()) {
            <div class="field-status field-status--error">
              <i class="fa-solid fa-circle-xmark"></i>
              <span>Le mot de passe ne respecte pas les critères.</span>
            </div>
          }
        </div>

        <!-- Confirmation -->
        <div>
          <label class="block text-sm text-gray-600 mb-1" for="confirm">
            Confirmer le nouveau mot de passe
          </label>
          <div class="pw-field">
            <input
              id="confirm"
              [type]="showConfirm() ? 'text' : 'password'"
              class="input pw-input"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="pw-toggle"
              (click)="toggle('confirm')"
              aria-label="Afficher/masquer"
            >
              <i class="fa-solid" [ngClass]="showConfirm() ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>

          <!-- OK -->
          @if (matchOk()) {
            <div class="field-status field-status--ok">
              <i class="fa-solid fa-circle-check"></i>
              <span>Mot de passe identique</span>
            </div>
          }

          <!-- Erreur -->
          @if (form.errors?.['mismatch'] && (form.touched || submitted()) && !matchOk()) {
            <div class="field-status field-status--error">
              <i class="fa-solid fa-circle-xmark"></i>
              <span>Les mots de passe ne correspondent pas.</span>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 divider">
          <button class="btn btn--primary" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            }
            Enregistrer
          </button>
          <a routerLink="/profile" class="btn btn--secondary">Annuler</a>

          @if (saved()) {
            <div class="success-badge">
              <i class="fa-solid fa-circle-check mr-2"></i> Mot de passe modifié
            </div>
          }
        </div>
      </form>
    </div>
  `,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  constructor() {
    const u = this.auth.getCurrentUser?.();
    if (u?.password) {
      this.form.patchValue({ currentPassword: u.password });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }

    this.form.valueChanges.subscribe(() => {
      const cp = this.form.controls.currentPassword.value ?? '';
      const np = this.form.controls.newPassword.value ?? '';
      const cf = this.form.controls.confirmPassword.value ?? '';

      this.newPasswordOk.set(this.isStrongPassword(np) && (!cp || np !== cp));
      this.matchOk.set(!!np && np === cf);
    });
  }

  saving = signal(false);
  saved = signal(false);
  submitted = signal(false);

  private _showCurrent = signal(false);
  private _showNew = signal(false);
  private _showConfirm = signal(false);
  showCurrent = this._showCurrent.asReadonly();
  showNew = this._showNew.asReadonly();
  showConfirm = this._showConfirm.asReadonly();

  toggle(which: 'current' | 'new' | 'confirm') {
    if (which === 'current') this._showCurrent.update((v) => !v);
    if (which === 'new') this._showNew.update((v) => !v);
    if (which === 'confirm') this._showConfirm.update((v) => !v);
  }

  private isStrongPassword(v: string): boolean {
    if (!v) return false;
    const okLen = v.length >= 8;
    const hasLower = /[a-z]/.test(v);
    const hasUpper = /[A-Z]/.test(v);
    const hasDigit = /\d/.test(v);
    return okLen && hasLower && hasUpper && hasDigit;
  }

  private notSameAsCurrentValidator = (group: AbstractControl): ValidationErrors | null => {
    const current = group.get('currentPassword')?.value ?? '';
    const next = group.get('newPassword')?.value ?? '';
    return current && next && current === next ? { sameAsCurrent: true } : null;
  };

  newPasswordOk = signal(false);
  matchOk = signal(false);

  private passwordPolicy = (c: AbstractControl): ValidationErrors | null => {
    const v = String(c.value ?? '');
    return this.isStrongPassword(v) ? null : { policy: true };
  };

  private matchValidator = (group: AbstractControl): ValidationErrors | null => {
    const newPass = group.get('newPassword')?.value ?? '';
    const confirm = group.get('confirmPassword')?.value ?? '';
    return newPass && confirm && newPass !== confirm ? { mismatch: true } : null;
  };

  form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, this.passwordPolicy]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.matchValidator, this.notSameAsCurrentValidator] }
  );

  isInvalid(ctrlName: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[ctrlName];
    return c.invalid && (c.dirty || c.touched || this.submitted());
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.saving.set(true);
    this.saved.set(false);

    type ToastVariant = 'success' | 'info' | 'warning' | 'error';
    interface ToastInput {
      variant: ToastVariant;
      title?: string;
      message: string;
      redirect?: string;
    }
    const toast = this.toast as unknown as {
      push?: (t: ToastInput) => void;
      success?: (title: string, message: string) => void;
      error?: (title: string, message: string) => void;
    };

    try {
      const { currentPassword, newPassword } = this.form.getRawValue();
      await this.auth.changePassword({ currentPassword, newPassword });

      this.form.reset({
        currentPassword: newPassword,
        newPassword: '',
        confirmPassword: '',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.newPasswordOk.set(false);
      this.matchOk.set(false);
      this.submitted.set(false);
      this.saved.set(true);

      if (typeof toast.success === 'function') {
        toast.success('Mot de passe modifié', 'Votre mot de passe a bien été mis à jour.');
      } else {
        toast.push?.({
          variant: 'success',
          title: 'Mot de passe modifié',
          message: 'Votre mot de passe a bien été mis à jour.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de modifier le mot de passe.';
      if (typeof toast.error === 'function') {
        toast.error('Échec de la modification', msg);
      } else {
        toast.push?.({ variant: 'error', title: 'Échec de la modification', message: msg });
      }
      console.error(e);
    } finally {
      this.saving.set(false);
    }
  }
}
