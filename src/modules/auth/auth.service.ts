import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import * as bcryptjs from 'bcryptjs';

interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  roles?: string[];
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
}

interface LoginResult {
  user: {
    id: string;
    email: string;
    username: string;
    nickname?: string | null;
    phone?: string | null;
    avatar?: string | null;
    roles?: Array<{
      id: string;
      code: string;
      name: string;
    }>;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  };
}

// 导出 LoginResult 类型
export type { LoginResult };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 验证用户凭证
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    username?: string | null;
    nickname?: string | null;
    phone?: string | null;
    avatar?: string | null;
  } | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcryptjs.compare(
      password,
      user.password || '',
    );
    if (!isPasswordValid) {
      return null;
    }

    // 返回用户信息（不包含密码）
    const { password: _pwd, ...result } = user;
    void _pwd; // Mark as intentionally unused
    return result;
  }

  /**
   * 用户登录
   */
  async login(user: {
    id: string;
    email: string;
    username?: string | null;
    nickname?: string | null;
    phone?: string | null;
    avatar?: string | null;
  }): Promise<LoginResult> {
    // 获取用户角色信息
    const userWithRoles = await this.usersService.findOne(user.id);
    if (!userWithRoles) {
      throw BusinessException.unauthorized('用户不存在');
    }

    // 构造token payload
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username || '',
      roles:
        userWithRoles.roles
          ?.map((ur) => ur.role?.code)
          .filter((code): code is string => !!code) || [],
    };

    // 生成tokens
    const tokens = await this.generateTokens(payload);

    // 构造返回结果
    const result: LoginResult = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username || '',
        nickname: user.nickname,
        phone: user.phone,
        avatar: user.avatar,
        roles:
          userWithRoles.roles
            ?.map((ur) =>
              ur.role
                ? {
                    id: ur.role.id,
                    code: ur.role.code,
                    name: ur.role.name,
                  }
                : null,
            )
            .filter(
              (role): role is { id: string; code: string; name: string } =>
                !!role,
            ) || [],
      },
      tokens,
    };

    return result;
  }

  /**
   * 刷新令牌
   */
  async refresh(
    userId: string,
    _email: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  }> {
    void _email; // Mark as intentionally unused (passed by JWT strategy but not needed)

    // 获取用户最新信息
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw BusinessException.unauthorized('用户不存在');
    }

    // 构造token payload
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username || '',
      roles:
        user.roles
          ?.map((ur) => ur.role?.code)
          .filter((code): code is string => !!code) || [],
    };

    // 生成新的tokens
    return this.generateTokens(payload);
  }

  /**
   * 用户注册
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
  }): Promise<LoginResult> {
    // 创建用户
    const user = await this.usersService.create(data);

    // 直接登录
    return this.login(user);
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(payload: TokenPayload): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  }> {
    const refreshPayload: RefreshTokenPayload = {
      sub: payload.sub,
      email: payload.email,
    };

    const refreshExpiresInStr =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(refreshPayload, {
        secret:
          this.configService.get<string>('jwt.refreshSecret') ||
          'default-refresh-secret',
        expiresIn: refreshExpiresInStr as unknown as number,
      }),
    ]);

    // 获取过期时间（秒）
    const accessExpiresIn = this.parseExpireTime(
      this.configService.get<string>('jwt.accessExpiresIn', '15m'),
    );
    const refreshExpiresIn = this.parseExpireTime(
      this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
    );

    return {
      accessToken,
      refreshToken,
      accessExpiresIn,
      refreshExpiresIn,
    };
  }

  /**
   * 解析过期时间字符串为秒
   * 例如: '15m' -> 900, '7d' -> 604800
   */
  private parseExpireTime(time: string): number {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1), 10);

    const unitToSeconds: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (unitToSeconds[unit] || 1);
  }
}
