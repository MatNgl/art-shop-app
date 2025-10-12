import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { User, UserRole, AuthResponse } from '../models/user.model';
import { OAuthProvider, OAuthResponse, OAuthUserInfo } from '../models/oauth.model';

@Injectable({ providedIn: 'root' })
export class OAuthService {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Mock OAuth configs (à remplacer par vrais IDs en prod)
  private readonly configs = {
    google: {
      provider: 'google' as const,
      clientId: 'mock-google-client-id',
      redirectUri: `${window.location.origin}/auth/oauth/callback`,
      scope: 'openid profile email',
    },
    facebook: {
      provider: 'facebook' as const,
      clientId: 'mock-facebook-app-id',
      redirectUri: `${window.location.origin}/auth/oauth/callback`,
      scope: 'public_profile,email',
    },
    apple: {
      provider: 'apple' as const,
      clientId: 'mock-apple-service-id',
      redirectUri: `${window.location.origin}/auth/oauth/callback`,
      scope: 'name email',
    },
  };

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Démarre le flux OAuth en redirigeant vers le provider
   * En mock: redirige vers notre callback avec params simulés
   */
  async initiateOAuth(provider: OAuthProvider): Promise<void> {
    const config = this.configs[provider];
    const state = this.generateState();

    // Stocker state pour validation callback
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', provider);

    // En prod: construire vraie URL OAuth du provider
    // const authUrl = this.buildAuthUrl(provider, config, state);
    // window.location.href = authUrl;

    // En mock: simuler redirect avec delay
    await this.delay(800);

    // Simuler retour du provider avec code d'auth
    const mockCode = this.generateMockCode(provider);
    const callbackUrl = `${config.redirectUri}?code=${mockCode}&state=${state}&provider=${provider}`;

    // Rediriger vers notre callback
    window.location.href = callbackUrl;
  }

  /**
   * Gère le callback OAuth (appelé par OAuthCallbackComponent)
   * Échange le code contre un token et récupère les infos user
   */
  async handleOAuthCallback(params: OAuthResponse): Promise<AuthResponse> {
    await this.delay(600);

    // Valider state
    const storedState = sessionStorage.getItem('oauth_state');
    if (params.state && params.state !== storedState) {
      throw new Error('État OAuth invalide (CSRF protection)');
    }

    // Nettoyer session
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');

    // En prod: échanger code contre access_token via backend
    // const tokenResponse = await this.exchangeCodeForToken(params.code, params.provider);
    // const userInfo = await this.fetchUserInfo(tokenResponse.access_token, params.provider);

    // En mock: simuler récupération user info
    const userInfo = this.mockFetchUserInfo(params.provider);

    // Créer ou récupérer user dans notre système
    const user = await this.findOrCreateUser(userInfo);

    return {
      user,
      token: `mock-oauth-token-${user.id}`,
    };
  }

  /**
   * Simule la récupération des infos user depuis le provider OAuth
   */
  private mockFetchUserInfo(provider: OAuthProvider): OAuthUserInfo {
    // Mock: en prod, le code serait utilisé pour échanger contre un access_token
    const mockUsers: Record<OAuthProvider, OAuthUserInfo> = {
      google: {
        id: 'google-user-123',
        email: 'user.google@example.com',
        firstName: 'User',
        lastName: 'Google',
        picture: 'https://ui-avatars.com/api/?name=User+Google&background=4285F4&color=fff',
        provider: 'google',
      },
      facebook: {
        id: 'facebook-user-456',
        email: 'user.facebook@example.com',
        firstName: 'User',
        lastName: 'Facebook',
        picture: 'https://ui-avatars.com/api/?name=User+Facebook&background=1877F2&color=fff',
        provider: 'facebook',
      },
      apple: {
        id: 'apple-user-789',
        email: 'user.apple@example.com',
        firstName: 'User',
        lastName: 'Apple',
        picture: 'https://ui-avatars.com/api/?name=User+Apple&background=000000&color=fff',
        provider: 'apple',
      },
    };

    return mockUsers[provider];
  }

  /**
   * Trouve ou crée un user dans notre système basé sur les infos OAuth
   */
  private async findOrCreateUser(oauthUser: OAuthUserInfo): Promise<User> {
    await this.delay(400);

    // Simuler vérification si user existe déjà (par email)
    // En prod: appel API backend qui gère link accounts + création
    const existingUser = this.authService.getCurrentUser();

    if (existingUser && existingUser.email === oauthUser.email) {
      // User déjà connecté avec même email
      return existingUser;
    }

    // Mock: créer nouveau user OAuth
    const now = new Date();
    const newUser: User = {
      id: Date.now(),
      email: oauthUser.email,
      firstName: oauthUser.firstName,
      lastName: oauthUser.lastName,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
    };

    return newUser;
  }

  /**
   * Génère un state CSRF pour sécuriser le flux OAuth
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Génère un code d'auth mock pour simulation
   */
  private generateMockCode(provider: OAuthProvider): string {
    return `mock-${provider}-code-${Date.now()}`;
  }

  /**
   * Construit l'URL d'autorisation OAuth réelle (pour prod)
   * @unused en mock
   */
  // private buildAuthUrl(provider: OAuthProvider, config: OAuthConfig, state: string): string {
  //   const authUrls: Record<OAuthProvider, string> = {
  //     google: 'https://accounts.google.com/o/oauth2/v2/auth',
  //     facebook: 'https://www.facebook.com/v12.0/dialog/oauth',
  //     apple: 'https://appleid.apple.com/auth/authorize',
  //   };
  //
  //   const baseUrl = authUrls[provider];
  //   const params = new URLSearchParams({
  //     client_id: config.clientId,
  //     redirect_uri: config.redirectUri,
  //     response_type: 'code',
  //     scope: config.scope,
  //     state,
  //   });
  //
  //   return `${baseUrl}?${params.toString()}`;
  // }
}
