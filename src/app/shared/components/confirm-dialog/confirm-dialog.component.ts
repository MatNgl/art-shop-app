import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (state()) {
    <div class="fixed inset-0 z-[90]">
      <!-- overlay -->
      <div class="absolute inset-0 bg-black/40" (click)="onOverlay()" aria-hidden="true"></div>

      <!-- panel -->
      <div
        class="absolute inset-0 flex items-center justify-center p-4"
        (keydown.escape)="onEsc()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirm-title-' + state()!.id"
        [attr.aria-describedby]="'confirm-desc-' + state()!.id"
      >
        <div
          class="w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden"
        >
          <div class="px-5 py-4 border-b flex items-center gap-3">
            <div
              class="h-8 w-8 rounded-full flex items-center justify-center"
              [ngClass]="state()!.options.variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'"
            >
              <i
                class="fa-solid"
                [ngClass]="
                  state()!.options.variant === 'danger'
                    ? 'fa-triangle-exclamation text-red-700'
                    : 'fa-circle-question text-blue-700'
                "
              ></i>
            </div>
            <h2 class="text-base font-semibold text-gray-900" [id]="'confirm-title-' + state()!.id">
              {{ state()!.options.title }}
            </h2>
          </div>

          <div class="px-5 py-4">
            <p class="text-sm text-gray-700" [id]="'confirm-desc-' + state()!.id">
              {{ state()!.options.message }}
            </p>

            @if (state()!.options.requireText) {
            <div class="mt-4">
              <input
                type="text"
                class="w-full px-3 py-2 border rounded-lg"
                [(ngModel)]="confirmInput"
                [placeholder]="state()!.options.requireText!.placeholder"
              />
              <p class="text-xs text-gray-500 mt-1" *ngIf="state()!.options.requireText!.help">
                {{ state()!.options.requireText!.help }}
              </p>
            </div>
            }
          </div>

          <div class="px-5 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-white border hover:bg-gray-100"
              (click)="cancel()"
            >
              {{ state()!.options.cancelText ?? 'Annuler' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-white"
              [ngClass]="
                state()!.options.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              "
              [disabled]="confirmDisabled()"
              (click)="confirm()"
            >
              {{ state()!.options.confirmText ?? 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class ConfirmDialogComponent {
  private readonly confirmSvc = inject(ConfirmService);

  state = computed(() => this.confirmSvc.state());
  confirmInput = signal<string>('');

  confirmDisabled = computed(() => {
    const s = this.state();
    if (!s || !s.options.requireText) return false;
    return this.confirmInput().trim() !== s.options.requireText.requiredValue;
  });

  confirm(): void {
    this.confirmSvc.confirm();
    this.confirmInput.set('');
  }
  cancel(): void {
    this.confirmSvc.cancel();
    this.confirmInput.set('');
  }
  onOverlay(): void {
    this.confirmSvc.dismiss();
    this.confirmInput.set('');
  }
  onEsc(): void {
    this.confirmSvc.dismiss();
    this.confirmInput.set('');
  }
}
