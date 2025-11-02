import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FileCategory {
  AVATAR = 'avatar',
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export class UploadFileDto {
  @ApiPropertyOptional({
    description: '文件分类',
    enum: FileCategory,
    default: FileCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否公开', default: false })
  @IsOptional()
  isPublic?: boolean;
}

export class FileListQueryDto {
  @ApiPropertyOptional({
    description: '文件分类',
    enum: FileCategory,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ description: '页码', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class FileResponse {
  @ApiProperty({ description: '文件ID' })
  id: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: '存储文件名' })
  filename: string;

  @ApiProperty({ description: '文件路径' })
  path: string;

  @ApiProperty({ description: '文件URL' })
  url: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '文件分类', enum: FileCategory })
  category: FileCategory;

  @ApiProperty({ description: '文件描述', required: false })
  description?: string;

  @ApiProperty({ description: '是否公开' })
  isPublic: boolean;

  @ApiProperty({ description: '上传者ID', required: false })
  uploaderId?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class UploadResponse {
  @ApiProperty({ description: '上传成功的文件信息' })
  file: FileResponse;

  @ApiProperty({ description: '访问URL' })
  url: string;
}

export class MultipleUploadResponse {
  @ApiProperty({ description: '上传成功的文件列表', type: [FileResponse] })
  files: FileResponse[];

  @ApiProperty({ description: '成功数量' })
  successCount: number;

  @ApiProperty({ description: '失败数量' })
  failedCount: number;

  @ApiProperty({ description: '失败详情', required: false })
  errors?: Array<{
    filename: string;
    error: string;
  }>;
}
