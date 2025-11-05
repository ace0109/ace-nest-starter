import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory, FileResponse, UploadFileDto } from './dto/upload.dto';
import { join } from 'path';
import { existsSync, unlinkSync, createReadStream } from 'fs';
import { PrismaService } from '../../common/prisma';

/**
 * 文件上传服务
 * 提供文件上传、下载、删除等功能
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly baseUploadPath: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUploadPath = join(
      process.cwd(),
      this.configService.get<string>('upload.path', './uploads'),
    );
    this.baseUrl = this.configService.get<string>(
      'app.url',
      'http://localhost:3000',
    );
  }

  /**
   * 处理单文件上传
   */
  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    userId?: string,
  ): Promise<FileResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const relativePath = file.path
      .replace(this.baseUploadPath, '')
      .replace(/\\/g, '/');
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    const category = dto.category || this.detectFileCategory(file.mimetype);

    const fileRecord = await this.fileRepository.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        path: cleanPath,
        mimeType: file.mimetype,
        size: file.size,
        category,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        uploaderId: userId,
      },
    });

    this.logger.log(
      `File uploaded: ${file.originalname} -> ${fileRecord.path} (${this.formatFileSize(file.size)})`,
    );

    return this.toFileResponse(fileRecord);
  }

  /**
   * 处理多文件上传
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: UploadFileDto,
    userId?: string,
  ): Promise<{
    files: FileResponse[];
    successCount: number;
    failedCount: number;
    errors?: Array<{ filename: string; error: string }>;
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results: FileResponse[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const fileResponse = await this.uploadFile(file, dto, userId);
        results.push(fileResponse);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.deletePhysicalFile(file.path);
      }
    }

    return {
      files: results,
      successCount: results.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 获取文件信息
   */
  async getFileById(fileId: string, userId?: string): Promise<FileResponse> {
    const file = await this.fileRepository.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    if (!file.isPublic && file.uploaderId !== userId) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    return this.toFileResponse(file);
  }

  /**
   * 获取文件列表
   */
  async getFileList(
    userId?: string,
    category?: FileCategory,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    files: FileResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const normalizedPage = Math.max(1, page ?? 1);
    const normalizedLimit = Math.max(1, Math.min(limit ?? 20, 100));

    const filters: Array<Record<string, unknown>> = [];

    if (userId) {
      filters.push({ OR: [{ isPublic: true }, { uploaderId: userId }] });
    } else {
      filters.push({ OR: [{ isPublic: true }, { uploaderId: null }] });
    }

    if (category) {
      filters.push({ category });
    }

    if (search) {
      filters.push({
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = filters.length === 1 ? filters[0] : { AND: filters };

    const [files, total] = await this.prisma.$transaction([
      this.fileRepository.findMany({
        where,
        skip: (normalizedPage - 1) * normalizedLimit,
        take: normalizedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.fileRepository.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));

    return {
      files: files.map((file) => this.toFileResponse(file)),
      total,
      page: normalizedPage,
      totalPages,
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const file = await this.fileRepository.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    if (file.uploaderId !== userId) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    const fullPath = join(this.baseUploadPath, file.path);

    await this.fileRepository.delete({ where: { id: fileId } });

    this.deletePhysicalFile(fullPath);

    this.logger.log(`File deleted: ${file.originalName} (${fileId})`);
  }

  /**
   * 批量删除文件
   */
  async deleteMultipleFiles(
    fileIds: string[],
    userId?: string,
  ): Promise<{
    successCount: number;
    failedCount: number;
    errors?: Array<{ fileId: string; error: string }>;
  }> {
    const errors: Array<{ fileId: string; error: string }> = [];
    let successCount = 0;

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId, userId);
        successCount++;
      } catch (error) {
        errors.push({
          fileId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 获取文件流（用于下载）
   */
  async getFileStream(fileId: string, userId?: string) {
    const file = await this.getFileById(fileId, userId);
    const fullPath = join(this.baseUploadPath, file.path);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      stream: createReadStream(fullPath),
      file,
    };
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    formattedSize: string;
    byCategory: Record<FileCategory, { count: number; size: number }>;
  }> {
    const where = userId ? { uploaderId: userId } : {};

    const [totalFiles, sizeAggregate, grouped] = await this.prisma.$transaction(
      [
        this.fileRepository.count({ where }),
        this.fileRepository.aggregate({ where, _sum: { size: true } }),
        this.fileRepository.groupBy({
          where,
          by: ['category'],
          _count: { _all: true },
          _sum: { size: true },
        }),
      ],
    );

    const byCategory: Record<FileCategory, { count: number; size: number }> = {
      [FileCategory.AVATAR]: { count: 0, size: 0 },
      [FileCategory.DOCUMENT]: { count: 0, size: 0 },
      [FileCategory.IMAGE]: { count: 0, size: 0 },
      [FileCategory.VIDEO]: { count: 0, size: 0 },
      [FileCategory.AUDIO]: { count: 0, size: 0 },
      [FileCategory.OTHER]: { count: 0, size: 0 },
    };

    for (const group of grouped) {
      const key = group.category as FileCategory;
      if (byCategory[key]) {
        byCategory[key].count = group._count._all;
        byCategory[key].size = group._sum.size ?? 0;
      }
    }

    const totalSize = sizeAggregate._sum.size ?? 0;

    return {
      totalFiles,
      totalSize,
      formattedSize: this.formatFileSize(totalSize),
      byCategory,
    };
  }

  /**
   * 清理过期文件（示例：清理30天前的临时文件）
   */
  async cleanupExpiredFiles(daysOld = 30): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filesToDelete = await this.fileRepository.findMany({
      where: {
        uploaderId: null,
        createdAt: { lt: cutoffDate },
      },
    });

    if (!filesToDelete.length) {
      return { deletedCount: 0, freedSpace: 0 };
    }

    const ids = filesToDelete.map((file) => file.id);
    const freedSpace = filesToDelete.reduce((sum, file) => sum + file.size, 0);

    await this.fileRepository.deleteMany({
      where: { id: { in: ids } },
    });

    for (const file of filesToDelete) {
      try {
        const fullPath = join(this.baseUploadPath, file.path);
        this.deletePhysicalFile(fullPath);
      } catch (error) {
        this.logger.error(`Failed to cleanup file: ${file.id}`, error);
      }
    }

    this.logger.log(
      `Cleaned up ${filesToDelete.length} expired files, freed ${this.formatFileSize(freedSpace)}`,
    );

    return {
      deletedCount: filesToDelete.length,
      freedSpace,
    };
  }

  /**
   * 根据 MIME 类型检测文件分类
   */
  private detectFileCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith('image/')) {
      return FileCategory.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return FileCategory.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileCategory.AUDIO;
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('msword') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('text')
    ) {
      return FileCategory.DOCUMENT;
    }
    return FileCategory.OTHER;
  }

  /**
   * 删除物理文件
   */
  private deletePhysicalFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete physical file: ${filePath}`, error);
    }
  }

  private get fileRepository(): PrismaService['file'] {
    return this.prisma.file;
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 转换为响应格式
   */
  private toFileResponse(file: {
    id: string;
    originalName: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
    category: string;
    description?: string | null;
    isPublic: boolean;
    uploaderId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FileResponse {
    const url = `${this.baseUrl}/uploads/${file.path}`;

    return {
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      path: file.path,
      url,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category as FileCategory,
      description: file.description ?? undefined,
      isPublic: file.isPublic,
      uploaderId: file.uploaderId ?? undefined,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
