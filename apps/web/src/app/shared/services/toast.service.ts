import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastType = 'default' | 'require-auth';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  type: ToastType;
  title?: string;
  redirect?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly activeToasts = new Set<string>(); // Pour éviter les doublons

  toasts = this._toasts.asReadonly();

  private show(
    message: string,
    variant: ToastVariant,
    type: ToastType = 'default',
    title?: string,
    redirect?: string,
    duration = 5000
  ): void {
    // Créer une clé unique pour éviter les doublons
    const toastKey = `${type}-${message}-${variant}-${redirect || ''}`;

    // Si ce toast est déjà affiché, ne pas le dupliquer
    if (this.activeToasts.has(toastKey)) {
      return;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast: Toast = {
      id,
      message,
      variant,
      type,
      title,
      redirect,
      duration,
    };

    this.activeToasts.add(toastKey);
    this._toasts.update((toasts) => [...toasts, toast]);

    // Auto-dismiss après la durée spécifiée
    setTimeout(() => {
      this.dismiss(id);
      this.activeToasts.delete(toastKey);
    }, duration);
  }

  success(message: string, title?: string): void {
    this.show(message, 'success', 'default', title);
  }

  error(message: string, title?: string): void {
    this.show(message, 'error', 'default', title);
  }

  warning(message: string, title?: string): void {
    this.show(message, 'warning', 'default', title);
  }

  info(message: string, title?: string): void {
    this.show(message, 'info', 'default', title);
  }

  requireAuth(context: 'cart' | 'favorites' | 'profile' | 'checkout', redirect?: string): void {
    const messages = {
      cart: 'Connectez-vous pour sauvegarder votre panier',
      favorites: 'Connectez-vous pour gérer vos favoris',
      profile: 'Connectez-vous pour accéder à votre profil',
      checkout: 'Connectez-vous pour finaliser votre commande',
    };

    const titles = {
      cart: 'Connexion requise',
      favorites: 'Connexion requise',
      profile: 'Connexion requise',
      checkout: 'Connexion requise',
    };

    this.show(
      messages[context],
      'info',
      'require-auth',
      titles[context],
      redirect,
      8000 // Durée plus longue pour les toasts d'auth
    );
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
    this.activeToasts.clear();
  }

  // Méthode pour forcer l'affichage même si un doublon existe (cas particuliers)
  forceShow(message: string, variant: ToastVariant, title?: string, duration = 5000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast: Toast = {
      id,
      message,
      variant,
      type: 'default',
      title,
      duration,
    };

    this._toasts.update((toasts) => [...toasts, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }
}
