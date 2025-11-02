import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, OAuthProfile } from '../interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.google.clientID') || '',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') || '',
      callbackURL:
        configService.get<string>('oauth.google.callbackURL') ||
        '/auth/google/callback',
      scope: configService.get<string[]>('oauth.google.scope') || [
        'email',
        'profile',
      ],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, emails, displayName, photos } = profile;

    const oauthProfile: OAuthProfile = {
      provider: OAuthProvider.GOOGLE,
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName,
      avatar: photos?.[0]?.value,
      raw: profile._json,
    };

    // 将处理后的 profile 传递给下一个中间件
    done(null, oauthProfile);
  }
}
