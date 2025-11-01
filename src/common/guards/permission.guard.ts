import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import type { Request } from 'express';
import { RequestUser } from '../decorators/user.decorators';

interface RequestWithUser extends Request {
  user?: RequestUser;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器中设置的权限要求
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有权限要求，直接通过
    if (
      !requiredPermission &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    // 获取用户信息
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // 合并单个权限和多个权限
    const allRequiredPermissions: string[] = [];
    if (requiredPermission) {
      allRequiredPermissions.push(requiredPermission);
    }
    if (requiredPermissions) {
      allRequiredPermissions.push(...requiredPermissions);
    }

    // 检查用户是否有任一必需权限
    for (const permission of allRequiredPermissions) {
      const hasPermission = await this.permissionsService.checkUserPermission(
        user.userId.toString(),
        permission,
      );
      if (hasPermission) {
        return true;
      }
    }

    return false;
  }
}
