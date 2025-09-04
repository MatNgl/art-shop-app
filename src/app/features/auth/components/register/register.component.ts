import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RegisterRequest } from '../../models/user.model';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen w-fit text-black flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="w-full space-y-8">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Créer un compte</h2>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nom</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isInvalid('name')"
            />
            @if (isInvalid('name')) {
            <p class="mt-1 text-sm text-red-600">Ce champ est requis</p>
            }
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Adresse email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isInvalid('email')"
            />
            @if (isInvalid('email')) {
            <p class="mt-1 text-sm text-red-600">Format d'email invalide</p>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700"
                >Mot de passe</label
              >
              <input
                id="password"
                type="password"
                formControlName="password"
                class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="isInvalid('password')"
              />
              @if (isInvalid('password')) {
              <p class="mt-1 text-sm text-red-600">Minimum 6 caractères</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700"
                >Confirmer le mot de passe</label
              >
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="
                  registerForm.hasError('passwordsMismatch') &&
                  (registerForm.dirty || registerForm.touched)
                "
              />
              @if (registerForm.hasError('passwordsMismatch') && (registerForm.dirty ||
              registerForm.touched)) {
              <p class="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
              }
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || loading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              @if (loading()) {
              <span
                class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              ></span>
              Création du compte... } @else { S'inscrire }
            </button>
          </div>

          @if (error()) {
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-sm text-red-600">{{ error() }}</p>
          </div>
          }
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string>('');

  registerForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatch] }
  );

  isInvalid(ctrl: string) {
    const c = this.registerForm.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const data = this.registerForm.value as RegisterRequest;

    try {
      const res = await this.auth.register(data); // Promise<AuthResult>
      this.loading.set(false);

      if (res.success) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/todos';
        this.router.navigate([returnUrl]);
      } else {
        this.error.set(res.error ?? 'Erreur lors de la création du compte');
      }
    } catch (e) {
      this.loading.set(false);
      this.error.set(e instanceof Error ? e.message : 'Erreur lors de la création du compte');
    }
  }
}
