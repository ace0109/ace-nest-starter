import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[\w\W]+$/, {
    message: 'New password must contain at least one letter and one number',
  })
  newPassword: string;
}
