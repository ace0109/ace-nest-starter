# OAuth 社交登录

## 概述

ACE NestJS Starter 支持多种社交平台的 OAuth 登录，包括 Google、GitHub、微信等。

## 支持的平台

- Google OAuth 2.0
- GitHub OAuth
- 微信登录
- Facebook Login
- Twitter OAuth

## Google OAuth 配置

### 策略配置

```typescript
// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('oauth.google.clientId'),
      clientSecret: configService.get('oauth.google.clientSecret'),
      callbackURL: configService.get('oauth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = await this.authService.validateOAuthLogin({
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      picture: profile.photos[0].value,
      provider: 'google',
      providerId: profile.id,
    });

    done(null, user);
  }
}
```

### 控制器实现

```typescript
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return this.authService.oAuthLogin(req.user);
  }
}
```

## GitHub OAuth

```typescript
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('oauth.github.clientId'),
      clientSecret: configService.get('oauth.github.clientSecret'),
      callbackURL: configService.get('oauth.github.callbackUrl'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.validateOAuthLogin({
      email: profile.emails[0].value,
      username: profile.username,
      avatar: profile.photos[0].value,
      provider: 'github',
      providerId: profile.id,
    });
  }
}
```

## 微信登录

```typescript
@Injectable()
export class WechatStrategy extends PassportStrategy(Strategy, 'wechat') {
  constructor(private configService: ConfigService) {
    super({
      appID: configService.get('oauth.wechat.appId'),
      appSecret: configService.get('oauth.wechat.appSecret'),
      callbackURL: configService.get('oauth.wechat.callbackUrl'),
      scope: 'snsapi_userinfo',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      openId: profile.openid,
      nickname: profile.nickname,
      avatar: profile.headimgurl,
      provider: 'wechat',
    };
  }
}
```

## 用户关联

```typescript
@Injectable()
export class AuthService {
  async validateOAuthLogin(profile: OAuthProfile) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.email },
          {
            socialAccounts: {
              some: {
                provider: profile.provider,
                providerId: profile.providerId,
              },
            },
          },
        ],
      },
      include: { socialAccounts: true },
    });

    if (!user) {
      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username || profile.email.split('@')[0],
          avatar: profile.avatar,
          socialAccounts: {
            create: {
              provider: profile.provider,
              providerId: profile.providerId,
            },
          },
        },
        include: { socialAccounts: true },
      });
    } else if (
      !user.socialAccounts.find((acc) => acc.provider === profile.provider)
    ) {
      // 关联社交账号
      await this.prisma.socialAccount.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerId: profile.providerId,
        },
      });
    }

    return user;
  }
}
```

## 前端集成

```html
<!-- 登录按钮 -->
<a href="/auth/google" class="btn-google"> Sign in with Google </a>

<a href="/auth/github" class="btn-github"> Sign in with GitHub </a>
```

## 安全考虑

1. 使用 HTTPS
2. 验证回调 URL
3. 状态参数防 CSRF
4. 安全存储密钥
5. 限制权限范围

## 下一步

- [认证系统](./authentication.md) - JWT 集成
- [用户管理](./authorization.md) - 权限控制
- [安全最佳实践](./security.md) - OAuth 安全
