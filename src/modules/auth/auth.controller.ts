import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators';

interface AuthRequest {
  user: {
    id: string;
    email: string;
    username: string;
    nickname?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
}

interface RefreshRequest {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用邮箱和密码登录' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      example: {
        success: true,
        code: 200,
        message: '登录成功',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid',
            email: 'user@example.com',
            username: 'username',
            nickname: '用户昵称',
            phone: '13800138000',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
        timestamp: 1234567890,
        traceId: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(@Request() req: AuthRequest, @Body() loginDto: LoginDto) {
    // loginDto 已经在 LocalAuthGuard 中验证，这里仅用于 Swagger 文档
    void loginDto; // 标记为已使用
    return this.authService.login(req.user);
  }

  /**
   * 用户注册
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号' })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    schema: {
      example: {
        success: true,
        code: 200,
        message: '注册成功',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid',
            email: 'user@example.com',
            username: 'username',
            nickname: '用户昵称',
            roles: ['user'],
          },
        },
        timestamp: 1234567890,
        traceId: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 刷新令牌
   */
  @Public()
  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新令牌',
    description: '使用刷新令牌获取新的访问令牌',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    schema: {
      example: {
        success: true,
        code: 200,
        message: '刷新成功',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        timestamp: 1234567890,
        traceId: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 401, description: '刷新令牌无效或已过期' })
  async refresh(
    @Request() req: RefreshRequest,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    // refreshTokenDto 已经在 RefreshJwtAuthGuard 中验证
    void refreshTokenDto; // 标记为已使用
    return this.authService.refresh(req.user.sub, req.user.email);
  }

  /**
   * 用户登出
   * 注意: JWT是无状态的，登出主要由前端处理（删除token）
   * 如需要服务端登出，需要实现token黑名单机制（需要Redis）
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '用户登出',
    description: '退出登录（前端需清除token）',
  })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      example: {
        success: true,
        code: 200,
        message: '登出成功',
        data: {
          message: '登出成功',
        },
        timestamp: 1234567890,
        traceId: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  logout() {
    // 当前实现：返回成功状态，由前端清除token
    // TODO: 实现Redis黑名单机制后，可以在服务端作废token
    return {
      message: '登出成功',
    };
  }
}
