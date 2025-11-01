import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreatePermissionDto {
  @IsString({ message: '权限名称必须是字符串' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  @MinLength(2, { message: '权限名称长度不能少于2位' })
  @MaxLength(50, { message: '权限名称长度不能超过50位' })
  name: string;

  @IsString({ message: '权限代码必须是字符串' })
  @IsNotEmpty({ message: '权限代码不能为空' })
  @Matches(/^([a-z]+|\*):([a-z]+|\*)$/, {
    message: '权限代码格式必须为 resource:action，如: user:create, *:*',
  })
  @MaxLength(100, { message: '权限代码长度不能超过100位' })
  code: string;

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  @MaxLength(200, { message: '权限描述长度不能超过200位' })
  description?: string;

  @IsString({ message: '模块名称必须是字符串' })
  @IsNotEmpty({ message: '模块名称不能为空' })
  @MaxLength(50, { message: '模块名称长度不能超过50位' })
  module: string;
}
