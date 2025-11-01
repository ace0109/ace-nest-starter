import { SetMetadata } from '@nestjs/common';

// Roles装饰器 - 要求用户必须有指定角色之一
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Permission装饰器 - 要求用户必须有指定权限
export const PERMISSION_KEY = 'permission';
export const Permission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

// Permissions装饰器 - 要求用户必须有指定权限之一
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Public装饰器 - 标记公开接口，不需要认证
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Resource装饰器 - 标记资源所有权检查
export const RESOURCE_KEY = 'resource';
export interface ResourceOptions {
  paramName?: string; // 默认为'id'
  ownerField?: string; // 资源中的所有者字段，默认为'userId'
}
export const Resource = (resourceType: string, options?: ResourceOptions) =>
  SetMetadata(RESOURCE_KEY, { resourceType, ...options });
