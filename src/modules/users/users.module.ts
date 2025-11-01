import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * 用户模块
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 导出服务供其他模块使用（如 Auth 模块）
})
export class UsersModule {}
