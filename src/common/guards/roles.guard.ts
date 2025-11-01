import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import type { Request } from 'express';
import type { RequestUser } from '../decorators/user.decorators';

interface RequestWithUser extends Request {
  user?: RequestUser & {
    roles?: string[];
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取装饰器中设置的角色要求
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有角色要求，直接通过
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取用户信息
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // 获取用户的角色
    const userRoles = user.roles || [];

    // 检查是否有超级管理员角色
    if (userRoles.includes('admin')) {
      return true;
    }

    // 检查是否有任一必需角色
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
