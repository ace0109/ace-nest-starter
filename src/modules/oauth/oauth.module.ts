import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { WeChatStrategy } from './strategies/wechat.strategy';
import { UsersModule } from '@/modules/users';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule,
    HttpModule,
    UsersModule,
    JwtModule.register({}), // 使用 ConfigService 的配置
  ],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    // 根据配置条件性注册策略
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GithubStrategy] : []),
    ...(process.env.WECHAT_APP_ID ? [WeChatStrategy] : []),
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
