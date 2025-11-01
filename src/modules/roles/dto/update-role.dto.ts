import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { RoleStatus } from '@prisma/client';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  @IsEnum(RoleStatus, { message: '状态值无效' })
  status?: RoleStatus;
}
