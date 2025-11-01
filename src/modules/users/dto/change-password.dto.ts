import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '原密码',
    example: 'OldPassword123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  oldPassword: string;

  @ApiProperty({
    description: '新密码，必须包含至少一个字母和一个数字',
    example: 'NewPassword456',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[\w\W]+$/, {
    message: 'New password must contain at least one letter and one number',
  })
  newPassword: string;
}
