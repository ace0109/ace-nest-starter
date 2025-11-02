import { Module } from '@nestjs/common';
import { DataMaskingService } from './data-masking.service';
import { SecurityService } from './security.service';

/**
 * 安全模块
 * 提供数据脱敏、安全工具等功能
 */
@Module({
  providers: [DataMaskingService, SecurityService],
  exports: [DataMaskingService, SecurityService],
})
export class SecurityModule {}
