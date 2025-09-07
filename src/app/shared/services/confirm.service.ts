import { Injectable, signal } from '@angular/core';

export type ConfirmVariant = 'primary' | 'danger';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** Optionnel : exiger un texte exact pour confirmer (ex: "SUPPRIMER") */
  requireText?: {
    placeholder: string;
    requiredValue: string;
    help?: string;
  };
}

interface ConfirmState {
  id: string;
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _state = signal<ConfirmState | null>(null);
  readonly state = this._state.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      this._state.set({ id, options, resolve });
    });
  }

  confirm(): void {
    const s = this._state();
    if (!s) return;
    s.resolve(true);
    this._state.set(null);
  }

  cancel(): void {
    const s = this._state();
    if (!s) return;
    s.resolve(false);
    this._state.set(null);
  }

  /** Ferme sans rien renvoyer (échappement, clic overlay) */
  dismiss(): void {
    this.cancel();
  }
}
