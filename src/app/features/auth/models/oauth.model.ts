export type OAuthProvider = 'google' | 'facebook' | 'apple';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface OAuthResponse {
  provider: OAuthProvider;
  code: string;
  state?: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: OAuthProvider;
}
