import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Define the user type that will be attached to the request
export interface RequestUser {
  userId: number;
  username: string;
  email: string;
  roles?: Array<{ id: number; name: string }>;
  permissions?: string[];
}

// Extend Express Request to include our user type
interface RequestWithUser extends Request {
  user?: RequestUser;
}

// 获取当前登录用户
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

// 获取当前用户ID
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.userId;
  },
);
