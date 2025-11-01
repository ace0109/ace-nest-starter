import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';

/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscore and dash',
  })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[\w\W]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar?: string;

  @IsOptional()
  @IsPhoneNumber('CN', { message: 'Invalid phone number' })
  @MaxLength(20)
  phone?: string;
}
