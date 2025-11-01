import {
  IsOptional,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

/**
 * 更新用户 DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  avatar?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
