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
import { v4 as uuidv4 } from 'uuid';

interface StoredFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  description?: string;
  isPublic: boolean;
  uploaderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 文件上传服务
 * 提供文件上传、下载、删除等功能
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly baseUploadPath: string;
  private readonly baseUrl: string;
  // 模拟数据库存储（实际项目中应该使用真实数据库）
  private readonly fileStorage = new Map<string, StoredFile>();

  constructor(private readonly configService: ConfigService) {
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
  uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    userId?: string,
  ): FileResponse {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 从文件路径中提取相对路径
    const relativePath = file.path
      .replace(this.baseUploadPath, '')
      .replace(/\\/g, '/');
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    // 根据 MIME 类型自动分类
    const category = dto.category || this.detectFileCategory(file.mimetype);

    // 创建文件记录
    const fileRecord: StoredFile = {
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: cleanPath,
      mimeType: file.mimetype,
      size: file.size,
      category,
      description: dto.description,
      isPublic: dto.isPublic ?? false,
      uploaderId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 保存到存储（实际项目中应该保存到数据库）
    this.fileStorage.set(fileRecord.id, fileRecord);

    this.logger.log(
      `File uploaded: ${file.originalname} -> ${fileRecord.path} (${this.formatFileSize(file.size)})`,
    );

    return this.toFileResponse(fileRecord);
  }

  /**
   * 处理多文件上传
   */
  uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: UploadFileDto,
    userId?: string,
  ): {
    files: FileResponse[];
    successCount: number;
    failedCount: number;
    errors?: Array<{ filename: string; error: string }>;
  } {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results: FileResponse[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const fileResponse = this.uploadFile(file, dto, userId);
        results.push(fileResponse);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // 删除上传失败的文件
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
  getFileById(fileId: string, userId?: string): FileResponse {
    const file = this.fileStorage.get(fileId);

    if (!file) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    // 检查权限：只有公开文件或文件所有者可以访问
    if (!file.isPublic && file.uploaderId !== userId) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    return this.toFileResponse(file);
  }

  /**
   * 获取文件列表
   */
  getFileList(
    userId?: string,
    category?: FileCategory,
    page = 1,
    limit = 20,
    search?: string,
  ): {
    files: FileResponse[];
    total: number;
    page: number;
    totalPages: number;
  } {
    // 过滤文件
    const filteredFiles = Array.from(this.fileStorage.values()).filter(
      (file) => {
        // 只返回用户自己的文件或公开文件
        if (!file.isPublic && file.uploaderId !== userId) {
          return false;
        }

        // 按分类过滤
        if (category && file.category !== category) {
          return false;
        }

        // 搜索过滤
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            file.originalName.toLowerCase().includes(searchLower) ||
            (file.description &&
              file.description.toLowerCase().includes(searchLower))
          );
        }

        return true;
      },
    );

    // 排序（按创建时间倒序）
    filteredFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    const total = filteredFiles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    return {
      files: paginatedFiles.map((file) => this.toFileResponse(file)),
      total,
      page,
      totalPages,
    };
  }

  /**
   * 删除文件
   */
  deleteFile(fileId: string, userId?: string): void {
    const file = this.fileStorage.get(fileId);

    if (!file) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    // 检查权限：只有文件所有者可以删除
    if (file.uploaderId !== userId) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    // 删除物理文件
    const fullPath = join(this.baseUploadPath, file.path);
    this.deletePhysicalFile(fullPath);

    // 删除记录
    this.fileStorage.delete(fileId);

    this.logger.log(`File deleted: ${file.originalName} (${fileId})`);
  }

  /**
   * 批量删除文件
   */
  deleteMultipleFiles(
    fileIds: string[],
    userId?: string,
  ): {
    successCount: number;
    failedCount: number;
    errors?: Array<{ fileId: string; error: string }>;
  } {
    const errors: Array<{ fileId: string; error: string }> = [];
    let successCount = 0;

    for (const fileId of fileIds) {
      try {
        this.deleteFile(fileId, userId);
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
  getFileStream(fileId: string, userId?: string) {
    const file = this.getFileById(fileId, userId);
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
  private toFileResponse(file: StoredFile): FileResponse {
    const url = `${this.baseUrl}/uploads/${file.path}`;

    return {
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      path: file.path,
      url,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      description: file.description,
      isPublic: file.isPublic,
      uploaderId: file.uploaderId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats(userId?: string): {
    totalFiles: number;
    totalSize: number;
    formattedSize: string;
    byCategory: Record<FileCategory, { count: number; size: number }>;
  } {
    const files = Array.from(this.fileStorage.values()).filter(
      (file) => !userId || file.uploaderId === userId,
    );

    const byCategory: Record<FileCategory, { count: number; size: number }> = {
      [FileCategory.AVATAR]: { count: 0, size: 0 },
      [FileCategory.DOCUMENT]: { count: 0, size: 0 },
      [FileCategory.IMAGE]: { count: 0, size: 0 },
      [FileCategory.VIDEO]: { count: 0, size: 0 },
      [FileCategory.AUDIO]: { count: 0, size: 0 },
      [FileCategory.OTHER]: { count: 0, size: 0 },
    };

    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;
      byCategory[file.category].count++;
      byCategory[file.category].size += file.size;
    }

    return {
      totalFiles: files.length,
      totalSize,
      formattedSize: this.formatFileSize(totalSize),
      byCategory,
    };
  }

  /**
   * 清理过期文件（示例：清理30天前的临时文件）
   */
  cleanupExpiredFiles(daysOld = 30): {
    deletedCount: number;
    freedSpace: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filesToDelete: string[] = [];
    let freedSpace = 0;

    for (const [fileId, file] of this.fileStorage.entries()) {
      // 只清理临时文件（没有uploaderId的文件）
      if (!file.uploaderId && file.createdAt < cutoffDate) {
        filesToDelete.push(fileId);
        freedSpace += file.size;
      }
    }

    for (const fileId of filesToDelete) {
      try {
        const file = this.fileStorage.get(fileId);
        if (file) {
          const fullPath = join(this.baseUploadPath, file.path);
          this.deletePhysicalFile(fullPath);
          this.fileStorage.delete(fileId);
        }
      } catch (error) {
        this.logger.error(`Failed to cleanup file: ${fileId}`, error);
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
}
