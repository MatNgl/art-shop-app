import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService } from '../../services/oauth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { OAuthProvider } from '../../models/oauth.model';

@Component({
  selector: 'app-oauth-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Divider -->
      <div class="relative mt-2">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-white/20"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span
            class="px-4 py-1 text-white/70 backdrop-blur-md bg-gradient-to-b from-black/20 to-black/10 rounded-lg"
          >
            Ou continuer avec
          </span>
        </div>
      </div>

      <!-- OAuth Buttons -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Google -->
        <button
          type="button"
          [disabled]="loading()"
          (click)="handleOAuth('google')"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5
                 rounded-xl border border-white/40
                 bg-white/10 hover:bg-white/20
                 text-white text-sm font-medium
                 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-white/30
                 disabled:opacity-50 disabled:cursor-not-allowed
                 backdrop-blur-sm"
          [attr.aria-busy]="loading() && loadingProvider() === 'google'"
        >
          @if (loading() && loadingProvider() === 'google') {
          <span
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></span>
          } @else {
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          }
          <span class="hidden sm:inline">Google</span>
        </button>

        <!-- Facebook -->
        <button
          type="button"
          [disabled]="loading()"
          (click)="handleOAuth('facebook')"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5
                 rounded-xl border border-white/40
                 bg-white/10 hover:bg-white/20
                 text-white text-sm font-medium
                 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-white/30
                 disabled:opacity-50 disabled:cursor-not-allowed
                 backdrop-blur-sm"
          [attr.aria-busy]="loading() && loadingProvider() === 'facebook'"
        >
          @if (loading() && loadingProvider() === 'facebook') {
          <span
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></span>
          } @else {
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          }
          <span class="hidden sm:inline">Facebook</span>
        </button>

        <!-- Apple -->
        <button
          type="button"
          [disabled]="loading()"
          (click)="handleOAuth('apple')"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5
                 rounded-xl border border-white/40
                 bg-white/10 hover:bg-white/20
                 text-white text-sm font-medium
                 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-white/30
                 disabled:opacity-50 disabled:cursor-not-allowed
                 backdrop-blur-sm"
          [attr.aria-busy]="loading() && loadingProvider() === 'apple'"
        >
          @if (loading() && loadingProvider() === 'apple') {
          <span
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></span>
          } @else {
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
            />
          </svg>
          }
          <span class="hidden sm:inline">Apple</span>
        </button>
      </div>
    </div>
  `,
})
export class OAuthButtonsComponent {
  private oauthService = inject(OAuthService);
  private toast = inject(ToastService);

  loading = signal(false);
  loadingProvider = signal<OAuthProvider | null>(null);

  async handleOAuth(provider: OAuthProvider): Promise<void> {
    this.loading.set(true);
    this.loadingProvider.set(provider);

    try {
      await this.oauthService.initiateOAuth(provider);
      // Pas besoin de toast success ici, redirect en cours
    } catch (error) {
      this.loading.set(false);
      this.loadingProvider.set(null);

      const message =
        error instanceof Error ? error.message : `Erreur de connexion avec ${provider}`;
      this.toast.error(message);
    }
  }
}
