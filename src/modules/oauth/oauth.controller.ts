import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
  Body,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { CurrentUser } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards';
import { OAuthProfile } from './interfaces';
import {
  OAuthLoginResponseDto,
  OAuthConnectionDto,
  OAuthLinkDto,
  OAuthUnlinkDto,
} from './dto';

interface OAuthRequest extends Request {
  user?: OAuthProfile;
}

@ApiTags('OAuth')
@Controller('auth/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauthService: OAuthService) {}

  // ========== Google OAuth ==========

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'Redirect URL after successful login',
  })
  googleAuth() {
    // Guard will redirect to Google
    // The redirect parameter is handled by the guard
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in',
    type: OAuthLoginResponseDto,
  })
  async googleAuthCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    if (!req.user) {
      return res.redirect('/login?error=oauth_failed');
    }

    try {
      const result = await this.oauthService.handleOAuthLogin(req.user);

      // 可以选择重定向到前端页面并携带 token
      const redirectUrl = state || '/dashboard';
      return res.redirect(
        `${redirectUrl}?token=${result.accessToken}&refresh=${result.refreshToken}`,
      );
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);
      return res.redirect('/login?error=oauth_failed');
    }
  }

  // ========== GitHub OAuth ==========

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'Redirect URL after successful login',
  })
  githubAuth() {
    // Guard will redirect to GitHub
    // The redirect parameter is handled by the guard
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in',
    type: OAuthLoginResponseDto,
  })
  async githubAuthCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    if (!req.user) {
      return res.redirect('/login?error=oauth_failed');
    }

    try {
      const result = await this.oauthService.handleOAuthLogin(req.user);

      // 可以选择重定向到前端页面并携带 token
      const redirectUrl = state || '/dashboard';
      return res.redirect(
        `${redirectUrl}?token=${result.accessToken}&refresh=${result.refreshToken}`,
      );
    } catch (error) {
      this.logger.error('GitHub OAuth callback error:', error);
      return res.redirect('/login?error=oauth_failed');
    }
  }

  // ========== WeChat OAuth ==========

  @Get('wechat')
  @ApiOperation({ summary: 'Get WeChat OAuth URL' })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'Redirect URL after successful login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns WeChat OAuth URL',
  })
  getWeChatAuthUrl(@Query('redirect') redirect?: string) {
    const appID = process.env.WECHAT_APP_ID || '';
    const redirectUri = encodeURIComponent(
      process.env.WECHAT_CALLBACK_URL ||
        'http://localhost:3000/auth/oauth/wechat/callback',
    );
    const state = redirect ? encodeURIComponent(redirect) : 'login';
    const scope = 'snsapi_userinfo';

    // 返回微信授权 URL
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;

    return { url: authUrl };
  }

  @Get('wechat/callback')
  @UseGuards(AuthGuard('wechat'))
  @ApiOperation({ summary: 'WeChat OAuth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in',
    type: OAuthLoginResponseDto,
  })
  async wechatAuthCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    if (!req.user) {
      return res.redirect('/login?error=oauth_failed');
    }

    try {
      const result = await this.oauthService.handleOAuthLogin(req.user);

      // 可以选择重定向到前端页面并携带 token
      const redirectUrl = state || '/dashboard';
      return res.redirect(
        `${redirectUrl}?token=${result.accessToken}&refresh=${result.refreshToken}`,
      );
    } catch (error) {
      this.logger.error('WeChat OAuth callback error:', error);
      return res.redirect('/login?error=oauth_failed');
    }
  }

  // ========== Account Linking ==========

  @Post('link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link OAuth account to current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account linked successfully',
    type: OAuthConnectionDto,
  })
  linkAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @CurrentUser() _userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _linkDto: OAuthLinkDto,
  ): Promise<OAuthConnectionDto> {
    // 这里需要实现一个流程来获取 OAuth profile
    // 可能需要存储临时的 OAuth 信息或使用不同的流程
    throw new Error('Link account flow not fully implemented');
  }

  @Delete('unlink')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink OAuth account from current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account unlinked successfully',
  })
  async unlinkAccount(
    @CurrentUser() userId: string,
    @Body() unlinkDto: OAuthUnlinkDto,
  ): Promise<{ message: string }> {
    await this.oauthService.unlinkOAuthAccount(userId, unlinkDto.provider);
    return { message: `${unlinkDto.provider} account unlinked successfully` };
  }

  // ========== User OAuth Info ==========

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all OAuth connections for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns OAuth connections',
    type: [OAuthConnectionDto],
  })
  async getConnections(
    @CurrentUser() userId: string,
  ): Promise<OAuthConnectionDto[]> {
    const connections = await this.oauthService.getUserOAuthConnections(userId);
    return connections.map((conn) => ({
      provider: conn.provider,
      providerId: conn.providerId,
      email: conn.email,
      name: conn.name,
      avatar: conn.avatar,
      connectedAt: conn.connectedAt,
    }));
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile with OAuth connections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns user profile with OAuth connections',
  })
  async getOAuthProfile(@CurrentUser() userId: string) {
    return await this.oauthService.getOAuthUser(userId);
  }
}
