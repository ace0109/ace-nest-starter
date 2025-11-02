# 权限控制 (RBAC)

## 概述

ACE NestJS Starter 实现了基于角色的访问控制（RBAC）系统，提供灵活的权限管理和细粒度的资源控制。

## 核心概念

- **角色 (Role)**: 一组权限的集合
- **权限 (Permission)**: 对特定资源的操作权限
- **资源 (Resource)**: 受保护的系统资源
- **动作 (Action)**: 对资源的操作类型

## 权限格式

权限采用 `resource:action` 格式：

- `user:create` - 创建用户权限
- `post:read` - 读取文章权限
- `comment:delete` - 删除评论权限
- `*:*` - 超级管理员权限
- `user:*` - 用户资源的所有权限

## 实现详情

### 角色守卫

```typescript
// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 权限检查

```typescript
// src/auth/decorators/permissions.decorator.ts
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata('permissions', permissions),
    UseGuards(JwtAuthGuard, PermissionsGuard),
  );

// 使用示例
@RequirePermissions('user:create')
@Post('users')
async createUser() {
  // ...
}
```

## 高级功能

### 动态权限

基于条件的权限检查，如用户只能编辑自己的资源。

### 权限继承

角色之间的层级关系和权限继承。

### 权限缓存

使用 Redis 缓存用户权限以提高性能。

## 最佳实践

1. 最小权限原则
2. 定期审计权限
3. 分离管理权限
4. 使用权限组

## 下一步

- [API 文档](../api/) - Swagger 文档
- [安全最佳实践](./security.md) - 安全配置
- [测试策略](./testing.md) - 测试 RBAC
