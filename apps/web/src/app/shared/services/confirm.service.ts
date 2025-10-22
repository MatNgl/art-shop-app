import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
  requireText?: {
    placeholder: string;
    requiredValue: string;
    help?: string;
  };
}

export interface ConfirmState {
  id: string;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _state = signal<ConfirmState | null>(null);
  readonly state = this._state.asReadonly();

  private uid(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }

  /**
   * Demande une confirmation à l'utilisateur
   * @param options Configuration de la dialog
   * @returns Promise<boolean> - true si confirmé, false si annulé
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const state: ConfirmState = {
        id: this.uid(),
        options: {
          variant: 'primary',
          confirmText: 'Confirmer',
          cancelText: 'Annuler',
          ...options,
        },
        resolve,
      };

      this._state.set(state);
    });
  }

  /**
   * Confirme l'action
   */
  confirm(): void {
    const currentState = this._state();
    if (currentState) {
      currentState.resolve(true);
      this._state.set(null);
    }
  }

  /**
   * Annule l'action
   */
  cancel(): void {
    const currentState = this._state();
    if (currentState) {
      currentState.resolve(false);
      this._state.set(null);
    }
  }

  /**
   * Ferme la dialog sans action (équivalent à annuler)
   */
  dismiss(): void {
    this.cancel();
  }
}
