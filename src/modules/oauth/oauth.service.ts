import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma';
import { UsersService } from '@/modules/users';
import {
  OAuthProvider,
  OAuthProfile,
  OAuthConnection,
  OAuthUser,
} from './interfaces';
import { OAuthLoginResponseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 处理 OAuth 登录/注册
   */
  async handleOAuthLogin(
    profile: OAuthProfile,
  ): Promise<OAuthLoginResponseDto> {
    try {
      // 1. 查找是否已有 OAuth 连接记录
      const existingConnection = await this.prisma.oAuthConnection.findUnique({
        where: {
          provider_providerId: {
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
        include: {
          user: true,
        },
      });

      let user;
      let isNewUser = false;

      if (existingConnection) {
        // 已存在连接，直接使用关联的用户
        user = existingConnection.user;

        // 更新 OAuth 连接信息（如头像、名称等可能变化）
        await this.prisma.oAuthConnection.update({
          where: { id: existingConnection.id },
          data: {
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            raw: profile.raw as Prisma.JsonValue,
          },
        });

        this.logger.log(`User ${user.id} logged in via ${profile.provider}`);
      } else {
        // 2. 没有连接记录，尝试通过邮箱查找用户
        if (profile.email) {
          user = await this.prisma.user.findUnique({
            where: { email: profile.email },
          });
        }

        if (user) {
          // 3. 找到用户，创建新的 OAuth 连接
          await this.createOAuthConnection(user.id, profile);
          this.logger.log(
            `Linked ${profile.provider} to existing user ${user.id}`,
          );
        } else {
          // 4. 没有找到用户，创建新用户和连接
          user = await this.createUserWithOAuth(profile);
          isNewUser = true;
          this.logger.log(
            `Created new user ${user.id} via ${profile.provider}`,
          );
        }
      }

      // 5. 生成 JWT tokens
      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.access.secret'),
        expiresIn: this.configService.get<string>('jwt.access.expiresIn'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refresh.secret'),
        expiresIn: this.configService.get<string>('jwt.refresh.expiresIn'),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          avatar: user.avatar || undefined,
        },
        isNewUser,
      };
    } catch (error) {
      this.logger.error('OAuth login error:', error);
      throw error;
    }
  }

  /**
   * 链接 OAuth 账号到现有用户
   */
  async linkOAuthAccount(
    userId: string,
    profile: OAuthProfile,
  ): Promise<OAuthConnection> {
    // 检查是否已存在连接
    const existingConnection = await this.prisma.oAuthConnection.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    if (existingConnection) {
      if (existingConnection.userId === userId) {
        throw new ConflictException(
          `This ${profile.provider} account is already linked to your account`,
        );
      } else {
        throw new ConflictException(
          `This ${profile.provider} account is already linked to another user`,
        );
      }
    }

    // 检查用户是否已经连接了该平台
    const userConnection = await this.prisma.oAuthConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: profile.provider,
        },
      },
    });

    if (userConnection) {
      throw new ConflictException(
        `You already have a ${profile.provider} account linked`,
      );
    }

    // 创建新连接
    const connection = await this.createOAuthConnection(userId, profile);

    return {
      provider: connection.provider as OAuthProvider,
      providerId: connection.providerId,
      email: connection.email || undefined,
      name: connection.name || undefined,
      avatar: connection.avatar || undefined,
      connectedAt: connection.createdAt,
    };
  }

  /**
   * 解除 OAuth 账号关联
   */
  async unlinkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
  ): Promise<void> {
    // 检查用户的 OAuth 连接数量
    const connectionCount = await this.prisma.oAuthConnection.count({
      where: { userId },
    });

    // 检查用户是否有密码
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (connectionCount <= 1 && !user?.password) {
      throw new ConflictException(
        'Cannot unlink the last OAuth account without a password set. Please set a password first.',
      );
    }

    // 删除连接
    const result = await this.prisma.oAuthConnection.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`No ${provider} account linked to this user`);
    }

    this.logger.log(`Unlinked ${provider} from user ${userId}`);
  }

  /**
   * 获取用户的所有 OAuth 连接
   */
  async getUserOAuthConnections(userId: string): Promise<OAuthConnection[]> {
    const connections = await this.prisma.oAuthConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((conn) => ({
      provider: conn.provider as OAuthProvider,
      providerId: conn.providerId,
      email: conn.email || undefined,
      name: conn.name || undefined,
      avatar: conn.avatar || undefined,
      connectedAt: conn.createdAt,
    }));
  }

  /**
   * 获取带 OAuth 连接的用户信息
   */
  async getOAuthUser(userId: string): Promise<OAuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthConnections: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
      providers: user.oauthConnections.map((conn) => ({
        provider: conn.provider as OAuthProvider,
        providerId: conn.providerId,
        email: conn.email || undefined,
        name: conn.name || undefined,
        avatar: conn.avatar || undefined,
        connectedAt: conn.createdAt,
      })),
    };
  }

  /**
   * 创建带 OAuth 的新用户
   */
  private async createUserWithOAuth(profile: OAuthProfile) {
    return await this.prisma.user.create({
      data: {
        email:
          profile.email ||
          `${profile.provider}_${profile.providerId}@oauth.local`,
        name: profile.name,
        avatar: profile.avatar,
        isActive: true,
        oauthConnections: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            raw: profile.raw as Prisma.JsonValue,
          },
        },
      },
      include: {
        oauthConnections: true,
      },
    });
  }

  /**
   * 创建 OAuth 连接记录
   */
  private async createOAuthConnection(userId: string, profile: OAuthProfile) {
    return await this.prisma.oAuthConnection.create({
      data: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        raw: profile.raw as Prisma.JsonValue,
      },
    });
  }
}
