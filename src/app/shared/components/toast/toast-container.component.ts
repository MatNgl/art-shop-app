import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed left-0 right-0 sm:left-auto sm:right-6 sm:w-[clamp(18rem,90vw,26rem)]
             top-[76px] z-[80] flex flex-col gap-3 px-3 sm:px-0 pointer-events-none"
      aria-live="polite"
    >
      @for (t of toasts(); track t.id) {
      <div
        class="pointer-events-auto rounded-xl border bg-white/95 backdrop-blur shadow-xl ring-1
               transition-all duration-300 p-4 flex items-center gap-3"
        [class.border-green-200]="t.variant === 'success'"
        [class.ring-green-600/20]="t.variant === 'success'"
        [class.border-blue-200]="t.variant === 'info'"
        [class.ring-blue-600/20]="t.variant === 'info'"
        [class.border-amber-200]="t.variant === 'warning'"
        [class.ring-amber-600/20]="t.variant === 'warning'"
        [class.border-red-200]="t.variant === 'error'"
        [class.ring-red-600/20]="t.variant === 'error'"
      >
        <!-- Icône -->
        <div>
          <div
            class="h-7 w-7 rounded-full flex items-center justify-center"
            [class.bg-green-100]="t.variant === 'success' && t.type !== 'require-auth'"
            [class.bg-blue-100]="t.variant === 'info' || t.type === 'require-auth'"
            [class.bg-amber-100]="t.variant === 'warning' && t.type !== 'require-auth'"
            [class.bg-red-100]="t.variant === 'error' && t.type !== 'require-auth'"
          >
            <i
              class="fa-solid fa-fw text-base"
              [ngClass]="{
                'fa-lock text-blue-700': t.type === 'require-auth',
                'fa-circle-check text-green-700': t.type !== 'require-auth' && t.variant === 'success',
                'fa-circle-info text-blue-700': t.type !== 'require-auth' && t.variant === 'info',
                'fa-triangle-exclamation text-amber-700': t.type !== 'require-auth' && t.variant === 'warning',
                'fa-circle-xmark text-red-700': t.type !== 'require-auth' && t.variant === 'error'
              }"
              aria-hidden="true"
            ></i>
          </div>
        </div>

        <!-- Contenu -->
        <div class="min-w-0">
          @if (t.title) {
            <div class="text-sm font-semibold text-gray-900">{{ t.title }}</div>
          }
          <div class="text-base text-gray-700" [innerText]="t.message"></div>

          @if (t.type === 'require-auth') {
            <div class="mt-3 flex gap-2">
              <button
                class="px-3 py-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-sm"
                (click)="goLogin(t)"
              >Se connecter</button>
              <button
                class="px-3 py-1.5 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm"
                (click)="goRegister(t)"
              >S'inscrire</button>
            </div>
          }
        </div>

        <!-- Fermer -->
        <button
          type="button"
          class="ml-auto -mr-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          (click)="close(t.id)"
          aria-label="Fermer"
          title="Fermer"
        ><i class="fa-solid fa-xmark"></i></button>
      </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  toasts = computed(() => this.toast.toasts());

  close(id: string) {
    this.toast.dismiss(id);
  }

  goLogin(t: Toast) {
    const redirect = t.redirect ?? this.router.url;
    this.toast.dismiss(t.id);
    this.router.navigate(['/auth/login'], { queryParams: { redirect } });
  }

  goRegister(t: Toast) {
    const redirect = t.redirect ?? this.router.url;
    this.toast.dismiss(t.id);
    this.router.navigate(['/auth/register'], { queryParams: { redirect } });
  }
}
