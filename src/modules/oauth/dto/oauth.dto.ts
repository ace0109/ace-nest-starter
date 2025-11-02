import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { OAuthProvider } from '../interfaces';

export class OAuthCallbackDto {
  @ApiProperty({ description: 'OAuth authorization code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'OAuth state parameter', required: false })
  @IsOptional()
  @IsString()
  state?: string;
}

export class OAuthLinkDto {
  @ApiProperty({
    description: 'OAuth provider to link',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;
}

export class OAuthUnlinkDto {
  @ApiProperty({
    description: 'OAuth provider to unlink',
    enum: OAuthProvider,
    example: OAuthProvider.GITHUB,
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;
}

export class OAuthProfileDto {
  @ApiProperty({ description: 'OAuth provider' })
  provider: OAuthProvider;

  @ApiProperty({ description: 'User ID from OAuth provider' })
  providerId: string;

  @ApiProperty({
    description: 'User email from OAuth provider',
    required: false,
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User name from OAuth provider',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'User avatar URL from OAuth provider',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class OAuthConnectionDto {
  @ApiProperty({ description: 'OAuth provider' })
  provider: OAuthProvider;

  @ApiProperty({ description: 'User ID from OAuth provider' })
  providerId: string;

  @ApiProperty({
    description: 'User email from OAuth provider',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'User name from OAuth provider',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'User avatar URL from OAuth provider',
    required: false,
  })
  avatar?: string;

  @ApiProperty({ description: 'Connection timestamp' })
  connectedAt: Date;
}

export class OAuthLoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };

  @ApiProperty({ description: 'Is this a new user registration' })
  isNewUser: boolean;
}
