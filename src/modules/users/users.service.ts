import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { User, UserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { BusinessException } from '../../common/exceptions/business.exception';

// 定义包含关联数据的用户类型
export type UserWithRoles = User & {
  roles?: Array<{
    role: {
      id: string;
      code: string;
      name: string;
      permissions?: Array<{
        permission: {
          id: string;
          code: string;
          name: string;
        };
      }>;
    };
  }>;
};

/**
 * 用户服务
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      // 创建用户
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      // 移除密码字段
      return this.excludePassword(user);
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  /**
   * 查询所有用户（分页）
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    const { skip = 0, take = 10, where, orderBy } = params;

    // 添加软删除条件
    const whereWithDeleted = {
      ...where,
      deletedAt: null,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where: whereWithDeleted,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereWithDeleted }),
    ]);

    return {
      users: users.map((user) => this.excludePassword(user)),
      total,
    };
  }

  /**
   * 根据 ID 查询用户
   */
  async findOne(id: string): Promise<Omit<UserWithRoles, 'password'>> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw BusinessException.notFound('User', id);
    }

    return this.excludePassword(user);
  }

  /**
   * 根据邮箱查询用户（包含密码，用于认证）
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * 根据用户名查询用户（包含密码，用于认证）
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });
  }

  /**
   * 更新用户
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // 检查用户是否存在
    await this.findOne(id);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });

      return this.excludePassword(user);
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw BusinessException.notFound('User', id);
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password || '',
    );

    if (!isPasswordValid) {
      throw BusinessException.invalidParameter('oldPassword', 'incorrect');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * 软删除用户
   */
  async remove(id: string): Promise<{ message: string }> {
    // 检查用户是否存在
    await this.findOne(id);

    // 软删除
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * 恢复已删除的用户
   */
  async restore(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: { not: null },
      },
    });

    if (!user) {
      throw BusinessException.notFound('Deleted user', id);
    }

    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        status: UserStatus.ACTIVE,
      },
    });

    return this.excludePassword(restoredUser);
  }

  /**
   * 处理唯一约束异常
   */
  private handleUniqueConstraintError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target[0]
        : (error.meta?.target as string | undefined);

      switch (target) {
        case 'email':
          throw new ConflictException('Email already exists');
        case 'username':
          throw new ConflictException('Username already exists');
        case 'phone':
          throw new ConflictException('Phone number already exists');
        default:
          throw new ConflictException('Unique constraint violated');
      }
    }
  }

  /**
   * 排除密码字段
   */
  private excludePassword<T extends { password?: string | null }>(
    user: T,
  ): Omit<T, 'password'> {
    const { password, ...userWithoutPassword } = user;
    void password; // Mark as intentionally excluded
    return userWithoutPassword;
  }
}
