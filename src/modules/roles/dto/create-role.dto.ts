import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MinLength(2, { message: '角色名称长度不能少于2位' })
  @MaxLength(50, { message: '角色名称长度不能超过50位' })
  name: string;

  @IsString({ message: '角色代码必须是字符串' })
  @IsNotEmpty({ message: '角色代码不能为空' })
  @Matches(/^[a-z]+(_[a-z]+)*$/, {
    message: '角色代码只能包含小写字母和下划线，格式如: admin, super_admin',
  })
  @MaxLength(50, { message: '角色代码长度不能超过50位' })
  code: string;

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述长度不能超过200位' })
  description?: string;
}
