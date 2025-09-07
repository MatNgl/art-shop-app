import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';
export type ToastType = 'default' | 'require-auth';

export interface Toast {
  id: string;
  type: ToastType;
  variant: ToastVariant;
  title?: string;
  message: string;
  /** ms (auto-dismiss). Laisser vide pour garder jusqu’au clic. */
  duration?: number;
  /** Pour require-auth: contexte + redirection */
  context?: 'cart' | 'favorites';
  redirect?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private uid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }

  show(toast: Omit<Toast, 'id'>) {
    const t: Toast = { id: this.uid(), ...toast };
    this._toasts.update((arr) => [t, ...arr]);

    if (t.duration && t.duration > 0) {
      setTimeout(() => this.dismiss(t.id), t.duration);
    }
    return t.id;
  }

  dismiss(id: string) {
    this._toasts.update((arr) => arr.filter((t) => t.id !== id));
  }

  clear() {
    this._toasts.set([]);
  }

  /** Helper pour dire "connexion requise" (avec CTA login/register) */
  requireAuth(context: 'cart' | 'favorites', redirect?: string) {
    this.show({
      type: 'require-auth',
      variant: 'warning',
      title: 'Connexion requise',
      message:
        context === 'cart'
          ? 'Connectez-vous ou créez un compte pour ajouter au panier.'
          : 'Connectez-vous ou créez un compte pour ajouter aux favoris.',
      duration: 5000,
      context,
      redirect,
    });
  }

  success(message: string, title = 'Succès', duration = 2000) {
    this.show({ type: 'default', variant: 'success', title, message, duration });
  }

  info(message: string, title = 'Info', duration = 2500) {
    this.show({ type: 'default', variant: 'info', title, message, duration });
  }

  error(message: string, title = 'Erreur', duration = 3500) {
    this.show({ type: 'default', variant: 'error', title, message, duration });
  }
  warning(message: string, title = 'Attention', duration = 3000) {
    this.show({ type: 'default', variant: 'warning', title, message, duration });
  }
}
