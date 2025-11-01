import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESOURCE_KEY, ResourceOptions } from '../decorators/auth.decorators';
import { PrismaService } from '../prisma';
import type { Request } from 'express';
import { RequestUser } from '../decorators/user.decorators';

interface RequestWithUser extends Request {
  user?: RequestUser & {
    roles?: string[];
  };
  params: Record<string, string>;
}

type PrismaModel = {
  findFirst: (args: {
    where: Record<string, unknown>;
  }) => Promise<Record<string, unknown> | null>;
};

@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器中设置的资源配置
    const resourceConfig = this.reflector.getAllAndOverride<
      { resourceType: string } & ResourceOptions
    >(RESOURCE_KEY, [context.getHandler(), context.getClass()]);

    // 如果没有资源配置，直接通过
    if (!resourceConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // 超级管理员直接通过
    if (user.roles?.includes('admin')) {
      return true;
    }

    // 获取资源ID
    const paramName = resourceConfig.paramName || 'id';
    const resourceId = request.params[paramName];

    if (!resourceId) {
      return false;
    }

    // 根据资源类型检查所有权
    const ownerField = resourceConfig.ownerField || 'userId';

    try {
      // 动态查询资源 - 使用类型断言来处理动态属性访问
      const prismaClient = this.prisma as unknown as Record<
        string,
        PrismaModel
      >;
      const model = prismaClient[resourceConfig.resourceType];

      if (!model) {
        return false;
      }

      const resource = await model.findFirst({
        where: {
          id: resourceId,
          [ownerField]: user.userId,
          deletedAt: null,
        },
      });

      return !!resource;
    } catch {
      // 如果资源类型不存在或查询失败，返回false
      return false;
    }
  }
}
