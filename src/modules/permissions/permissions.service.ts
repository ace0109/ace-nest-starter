import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { Permission, Prisma } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建权限
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限代码是否已存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code: createPermissionDto.code },
    });

    if (existingPermission) {
      throw BusinessException.duplicate(
        'Permission code',
        createPermissionDto.code,
      );
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  /**
   * 查询权限列表（分页）
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    module?: string;
  }): Promise<{
    permissions: Permission[];
    total: number;
  }> {
    const { page = 1, pageSize = 10, name, code, module } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PermissionWhereInput = {
      ...(name && {
        name: { contains: name, mode: 'insensitive' },
      }),
      ...(code && {
        code: { contains: code, mode: 'insensitive' },
      }),
      ...(module && {
        module: { contains: module, mode: 'insensitive' },
      }),
    };

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { module: 'asc' },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return { permissions, total };
  }

  /**
   * 根据ID查询权限
   */
  async findOne(id: string): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw BusinessException.notFound('Permission', id);
    }

    return permission;
  }

  /**
   * 根据代码查询权限
   */
  async findByCode(code: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { code },
    });
  }

  /**
   * 按模块分组获取权限
   */
  async findGroupedByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    // 按模块分组
    return permissions.reduce(
      (grouped, permission) => {
        const module = permission.module;
        if (!grouped[module]) {
          grouped[module] = [];
        }
        grouped[module].push(permission);
        return grouped;
      },
      {} as Record<string, Permission[]>,
    );
  }

  /**
   * 更新权限
   */
  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // 如果要更新code，检查是否重复
    if (
      updatePermissionDto.code &&
      updatePermissionDto.code !== permission.code
    ) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { code: updatePermissionDto.code },
      });
      if (existingPermission) {
        throw BusinessException.duplicate(
          'Permission code',
          updatePermissionDto.code,
        );
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  /**
   * 删除权限
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    // 检查是否有角色使用该权限
    const roleCount = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (roleCount > 0) {
      throw BusinessException.forbidden(
        `权限正在被 ${roleCount} 个角色使用，不能删除`,
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: '权限删除成功' };
  }

  /**
   * 批量创建权限（用于初始化）
   */
  async createMany(
    permissions: CreatePermissionDto[],
  ): Promise<{ count: number }> {
    // 过滤掉已存在的权限
    const existingCodes = await this.prisma.permission.findMany({
      where: {
        code: { in: permissions.map((p) => p.code) },
      },
      select: { code: true },
    });

    const existingCodeSet = new Set(existingCodes.map((p) => p.code));
    const newPermissions = permissions.filter(
      (p) => !existingCodeSet.has(p.code),
    );

    if (newPermissions.length === 0) {
      return { count: 0 };
    }

    const result = await this.prisma.permission.createMany({
      data: newPermissions,
      skipDuplicates: true,
    });

    return result;
  }

  /**
   * 检查用户是否有指定权限
   */
  async checkUserPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    // 获取用户的所有角色
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
    });

    // 检查是否有超级管理员权限
    const hasAdminPermission = userRoles.some((ur) =>
      ur.role.permissions?.some((rp) => rp.permission.code === '*:*'),
    );

    if (hasAdminPermission) {
      return true;
    }

    // 检查是否有指定权限
    return userRoles.some((ur) =>
      ur.role.permissions?.some((rp) => rp.permission.code === permissionCode),
    );
  }
}
