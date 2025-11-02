import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, OAuthProfile } from '../interfaces';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.github.clientID') || '',
      clientSecret:
        configService.get<string>('oauth.github.clientSecret') || '',
      callbackURL:
        configService.get<string>('oauth.github.callbackURL') ||
        '/auth/github/callback',
      scope: configService.get<string[]>('oauth.github.scope') || [
        'user:email',
      ],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ): void {
    const { id, emails, displayName, username, photos } = profile;

    const oauthProfile: OAuthProfile = {
      provider: OAuthProvider.GITHUB,
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName || username,
      avatar: photos?.[0]?.value,
      raw: profile,
    };

    // 将处理后的 profile 传递给下一个中间件
    done(null, oauthProfile);
  }
}
