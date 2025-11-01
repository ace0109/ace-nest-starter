import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { Role, RoleStatus, Prisma } from '@prisma/client';

// 定义包含权限的角色类型
export type RoleWithPermissions = Role & {
  permissions?: Array<{
    permission: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      module: string;
    };
  }>;
};

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建角色
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色代码是否已存在
    const existingRole = await this.prisma.role.findUnique({
      where: { code: createRoleDto.code },
    });

    if (existingRole) {
      throw BusinessException.duplicate('Role code', createRoleDto.code);
    }

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        code: createRoleDto.code,
        description: createRoleDto.description,
        isSystem: false,
      },
    });
  }

  /**
   * 查询角色列表（分页）
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    status?: RoleStatus;
  }): Promise<{
    roles: RoleWithPermissions[];
    total: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      name,
      code,
      status = RoleStatus.ACTIVE,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
      status,
      ...(name && {
        name: { contains: name, mode: 'insensitive' },
      }),
      ...(code && {
        code: { contains: code, mode: 'insensitive' },
      }),
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return { roles, total };
  }

  /**
   * 根据ID查询角色
   */
  async findOne(id: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw BusinessException.notFound('Role', id);
    }

    return role;
  }

  /**
   * 根据代码查询角色
   */
  async findByCode(code: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * 更新角色
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // 系统角色不能修改
    if (role.isSystem) {
      throw BusinessException.forbidden('系统角色不能修改');
    }

    // 如果要更新code，检查是否重复
    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existingRole = await this.prisma.role.findUnique({
        where: { code: updateRoleDto.code },
      });
      if (existingRole) {
        throw BusinessException.duplicate('Role code', updateRoleDto.code);
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  /**
   * 删除角色（软删除）
   */
  async remove(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id);

    // 系统角色不能删除
    if (role.isSystem) {
      throw BusinessException.forbidden('系统角色不能删除');
    }

    // 检查是否有用户使用该角色
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw BusinessException.forbidden(
        `角色正在被 ${userCount} 个用户使用，不能删除`,
      );
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: RoleStatus.INACTIVE,
      },
    });

    return { message: '角色删除成功' };
  }

  /**
   * 分配权限给角色
   */
  async assignPermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<RoleWithPermissions> {
    const role = await this.findOne(id);

    // 系统角色不能修改权限
    if (role.isSystem) {
      throw BusinessException.forbidden('系统角色权限不能修改');
    }

    // 验证权限ID是否存在
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: assignPermissionsDto.permissionIds },
      },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw BusinessException.badRequest('部分权限ID无效');
    }

    // 使用事务处理
    return this.prisma.$transaction(async (tx) => {
      // 先删除原有权限
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // 添加新权限
      if (assignPermissionsDto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: assignPermissionsDto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // 返回更新后的角色（包含权限）
      return tx.role.findFirstOrThrow({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  /**
   * 给用户分配角色
   */
  async assignToUser(
    userId: string,
    roleIds: string[],
  ): Promise<{ message: string }> {
    // 验证用户是否存在
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw BusinessException.notFound('User', userId);
    }

    // 验证角色是否存在
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        deletedAt: null,
        status: RoleStatus.ACTIVE,
      },
    });

    if (roles.length !== roleIds.length) {
      throw BusinessException.badRequest('部分角色ID无效或已禁用');
    }

    // 使用事务处理
    await this.prisma.$transaction(async (tx) => {
      // 先删除用户原有角色
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // 分配新角色
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
        });
      }
    });

    return { message: '角色分配成功' };
  }
}
