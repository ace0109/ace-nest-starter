import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OAuthProvider, OAuthProfile } from '../interfaces';
import { Request } from 'express';

interface WeChatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

interface WeChatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  language: string;
  city: string;
  province: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

@Injectable()
export class WeChatStrategy extends PassportStrategy(Strategy, 'wechat') {
  private readonly logger = new Logger(WeChatStrategy.name);
  private readonly appID: string;
  private readonly appSecret: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    super();
    this.appID = configService.get<string>('oauth.wechat.appID') || '';
    this.appSecret = configService.get<string>('oauth.wechat.appSecret') || '';
  }

  async validate(
    req: Request & { query: Record<string, string> },
  ): Promise<OAuthProfile> {
    const { code } = req.query;

    if (!code) {
      throw new Error('WeChat OAuth code is required');
    }

    try {
      // 1. 获取 access_token
      const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appID}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`;

      const tokenResponse = await firstValueFrom(
        this.httpService.get<WeChatAccessTokenResponse>(tokenUrl),
      );

      if (!tokenResponse.data.access_token) {
        throw new Error('Failed to get WeChat access token');
      }

      const { access_token, openid, unionid } = tokenResponse.data;

      // 2. 获取用户信息
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;

      const userResponse = await firstValueFrom(
        this.httpService.get<WeChatUserInfo>(userInfoUrl),
      );

      const userInfo = userResponse.data;

      // 3. 构建 OAuth profile
      const oauthProfile: OAuthProfile = {
        provider: OAuthProvider.WECHAT,
        providerId: unionid || openid, // 优先使用 unionid（跨应用唯一）
        email: undefined, // 微信不提供邮箱
        name: userInfo.nickname,
        avatar: userInfo.headimgurl,
        raw: userInfo,
      };

      return oauthProfile;
    } catch (error) {
      this.logger.error('WeChat OAuth error:', error);
      throw new Error('WeChat OAuth authentication failed');
    }
  }
}
