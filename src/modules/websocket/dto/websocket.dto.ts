import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateDto {
  @ApiProperty({ description: 'JWT access token' })
  @IsString()
  token: string;
}

export class JoinRoomDto {
  @ApiProperty({ description: 'Room name to join' })
  @IsString()
  room: string;
}

export class LeaveRoomDto {
  @ApiProperty({ description: 'Room name to leave' })
  @IsString()
  room: string;
}

export class RoomMessageDto {
  @ApiProperty({ description: 'Room name' })
  @IsString()
  room: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;
}

export class PrivateMessageDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsString()
  targetUserId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;
}

export class BroadcastDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Require authentication', required: false })
  @IsOptional()
  @IsBoolean()
  requireAuth?: boolean;
}

export class UpdateStatusDto {
  @ApiProperty({ description: 'User status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
