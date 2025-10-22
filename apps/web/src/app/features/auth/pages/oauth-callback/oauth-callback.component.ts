import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OAuthService } from '../../services/oauth.service';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { OAuthProvider, OAuthResponse } from '../../models/oauth.model';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="max-w-md w-full mx-4">
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
          @if (loading()) {
            <!-- Loading state -->
            <div class="space-y-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <span
                  class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
                ></span>
              </div>
              <h2 class="text-xl font-semibold text-gray-800">Connexion en cours...</h2>
              <p class="text-sm text-gray-600">
                Finalisation de votre authentification {{ providerLabel() }}
              </p>
            </div>
          } @else if (error()) {
            <!-- Error state -->
            <div class="space-y-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <svg
                  class="h-8 w-8 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-800">Erreur d'authentification</h2>
              <p class="text-sm text-gray-600">{{ error() }}</p>
              <button
                type="button"
                (click)="backToLogin()"
                class="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  class="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Retour à la connexion
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private oauthService = inject(OAuthService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal(true);
  error = signal<string | null>(null);
  provider = signal<OAuthProvider | null>(null);

  providerLabel = signal<string>('');

  async ngOnInit(): Promise<void> {
    try {
      // Extraire params de callback
      const params = this.route.snapshot.queryParamMap;
      const code = params.get('code');
      const state = params.get('state');
      const provider = params.get('provider') as OAuthProvider | null;

      if (!code || !provider) {
        throw new Error('Paramètres OAuth manquants');
      }

      this.provider.set(provider);
      this.providerLabel.set(this.getProviderLabel(provider));

      // Construire response OAuth
      const oauthResponse: OAuthResponse = {
        provider,
        code,
        state: state || undefined,
      };

      // Traiter callback + récupérer user
      const authResponse = await this.oauthService.handleOAuthCallback(oauthResponse);

      // Authentifier dans notre système
      // Note: en mock, on stocke directement. En prod, le backend gère ça
      if (authResponse.user) {
        // Simuler persistence session (normalement fait par AuthService)
        localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
        localStorage.setItem('authToken', authResponse.token);

        this.toast.success(`Bienvenue ${authResponse.user.firstName} !`);

        // Rediriger selon rôle
        const redirect =
          authResponse.user.role === 'admin' ? '/admin' : '/catalog';
        await this.router.navigateByUrl(redirect);
      } else {
        throw new Error('Authentification échouée');
      }
    } catch (err) {
      this.loading.set(false);
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la connexion OAuth';
      this.error.set(message);
      this.toast.error(message);
    }
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private getProviderLabel(provider: OAuthProvider): string {
    const labels: Record<OAuthProvider, string> = {
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
    };
    return labels[provider];
  }
}
