export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  WECHAT = 'wechat',
}

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
  raw?: unknown;
}

export interface OAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  providers: OAuthConnection[];
}

export interface OAuthConnection {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
  connectedAt: Date;
}

export interface OAuthConfig {
  google?: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  };
  github?: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  };
  wechat?: {
    appID: string;
    appSecret: string;
    callbackURL: string;
    scope?: string;
  };
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
}
