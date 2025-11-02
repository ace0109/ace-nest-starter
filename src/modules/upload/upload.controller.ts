import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  NotFoundException,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import {
  UploadFileDto,
  FileListQueryDto,
  FileResponse,
  UploadResponse,
  MultipleUploadResponse,
  FileCategory,
} from './dto/upload.dto';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUserId } from '../../common/decorators/user.decorators';

/**
 * 文件上传控制器
 */
@ApiTags('upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传单个文件
   */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '文件上传',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
        category: {
          type: 'string',
          enum: Object.values(FileCategory),
          description: '文件分类',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
        isPublic: {
          type: 'boolean',
          description: '是否公开',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    type: UploadResponse,
  })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUserId() userId?: string,
  ): UploadResponse {
    const fileResponse = this.uploadService.uploadFile(file, dto, userId);
    return {
      file: fileResponse,
      url: fileResponse.url,
    };
  }

  /**
   * 上传多个文件
   */
  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 10)) // 最多10个文件
  @ApiOperation({ summary: '上传多个文件（最多10个）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '多文件上传',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '要上传的文件列表',
        },
        category: {
          type: 'string',
          enum: Object.values(FileCategory),
          description: '文件分类',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
        isPublic: {
          type: 'boolean',
          description: '是否公开',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    type: MultipleUploadResponse,
  })
  uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadFileDto,
    @CurrentUserId() userId?: string,
  ): MultipleUploadResponse {
    return this.uploadService.uploadMultipleFiles(files, dto, userId);
  }

  /**
   * 上传头像
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: '上传用户头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '头像上传',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: '头像文件（仅支持图片）',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    type: UploadResponse,
  })
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId?: string,
  ): UploadResponse {
    // 验证是否为图片
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file');
    }

    const fileResponse = this.uploadService.uploadFile(
      file,
      { category: FileCategory.AVATAR, isPublic: true },
      userId,
    );

    return {
      file: fileResponse,
      url: fileResponse.url,
    };
  }

  /**
   * 获取文件列表
   */
  @Get('files')
  @ApiOperation({ summary: '获取文件列表' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: FileCategory,
    description: '文件分类',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词',
  })
  @ApiResponse({
    status: 200,
    description: '文件列表',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { $ref: '#/components/schemas/FileResponse' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  getFileList(
    @Query() query: FileListQueryDto,
    @CurrentUserId() userId?: string,
  ) {
    return this.uploadService.getFileList(
      userId,
      query.category,
      query.page,
      query.limit,
      query.search,
    );
  }

  /**
   * 获取文件信息
   */
  @Get('file/:id')
  @ApiOperation({ summary: '获取文件信息' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({
    status: 200,
    description: '文件信息',
    type: FileResponse,
  })
  getFileInfo(
    @Param('id') fileId: string,
    @CurrentUserId() userId?: string,
  ): FileResponse {
    return this.uploadService.getFileById(fileId, userId);
  }

  /**
   * 下载文件
   */
  @Get('download/:id')
  @ApiOperation({ summary: '下载文件' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({
    status: 200,
    description: '文件流',
  })
  downloadFile(
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUserId() userId?: string,
  ): StreamableFile {
    const { stream, file } = this.uploadService.getFileStream(fileId, userId);

    // 设置响应头
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    return new StreamableFile(stream);
  }

  /**
   * 删除文件
   */
  @Delete('file/:id')
  @ApiOperation({ summary: '删除文件' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  deleteFile(
    @Param('id') fileId: string,
    @CurrentUserId() userId?: string,
  ): { message: string } {
    this.uploadService.deleteFile(fileId, userId);
    return { message: 'File deleted successfully' };
  }

  /**
   * 批量删除文件
   */
  @Delete('files')
  @ApiOperation({ summary: '批量删除文件' })
  @ApiBody({
    description: '要删除的文件ID列表',
    schema: {
      type: 'object',
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: '文件ID列表',
        },
      },
      required: ['fileIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '删除结果',
    schema: {
      type: 'object',
      properties: {
        successCount: { type: 'number' },
        failedCount: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  deleteMultipleFiles(
    @Body('fileIds') fileIds: string[],
    @CurrentUserId() userId?: string,
  ) {
    return this.uploadService.deleteMultipleFiles(fileIds, userId);
  }

  /**
   * 获取存储统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取存储统计信息' })
  @ApiResponse({
    status: 200,
    description: '存储统计',
    schema: {
      type: 'object',
      properties: {
        totalFiles: { type: 'number' },
        totalSize: { type: 'number' },
        formattedSize: { type: 'string' },
        byCategory: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              count: { type: 'number' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  getStorageStats(@CurrentUserId() userId?: string) {
    return this.uploadService.getStorageStats(userId);
  }

  /**
   * 清理过期文件（管理员功能）
   */
  @Post('cleanup')
  @ApiOperation({ summary: '清理过期文件（需要管理员权限）' })
  @ApiBody({
    description: '清理参数',
    schema: {
      type: 'object',
      properties: {
        daysOld: {
          type: 'number',
          description: '清理多少天前的文件',
          default: 30,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '清理结果',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        freedSpace: { type: 'number' },
      },
    },
  })
  cleanupExpiredFiles(@Body('daysOld') daysOld?: number) {
    // TODO: 添加管理员权限检查
    return this.uploadService.cleanupExpiredFiles(daysOld);
  }
}

/**
 * 公开文件访问控制器
 */
@ApiTags('public-files')
@Controller('public')
@Public()
export class PublicFileController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 获取公开文件
   */
  @Get('file/:id')
  @ApiOperation({ summary: '获取公开文件信息' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({
    status: 200,
    description: '文件信息',
    type: FileResponse,
  })
  getPublicFile(@Param('id') fileId: string): FileResponse {
    const file = this.uploadService.getFileById(fileId);
    if (!file.isPublic) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  /**
   * 下载公开文件
   */
  @Get('download/:id')
  @ApiOperation({ summary: '下载公开文件' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({
    status: 200,
    description: '文件流',
  })
  downloadPublicFile(
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const file = this.uploadService.getFileById(fileId);
    if (!file.isPublic) {
      throw new NotFoundException('File not found');
    }

    const { stream } = this.uploadService.getFileStream(fileId);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    return new StreamableFile(stream);
  }
}
