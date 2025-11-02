import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from './upload.service';
import { UploadController, PublicFileController } from './upload.controller';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uploadPath = configService.get<string>(
          'upload.path',
          './uploads',
        );

        // 确保上传目录存在
        const fullUploadPath = join(process.cwd(), uploadPath);
        if (!existsSync(fullUploadPath)) {
          mkdirSync(fullUploadPath, { recursive: true });
        }

        // 创建年月子目录
        const createDatePath = () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const datePath = join(fullUploadPath, year.toString(), month);

          if (!existsSync(datePath)) {
            mkdirSync(datePath, { recursive: true });
          }

          return join(year.toString(), month);
        };

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              const datePath = createDatePath();
              const fullPath = join(fullUploadPath, datePath);
              cb(null, fullPath);
            },
            filename: (req, file, cb) => {
              // 生成唯一文件名: uuid + 原始扩展名
              const uniqueSuffix = uuidv4();
              const ext = extname(file.originalname);
              const filename = `${uniqueSuffix}${ext}`;
              cb(null, filename);
            },
          }),
          limits: {
            fileSize: configService.get<number>(
              'upload.maxFileSize',
              10 * 1024 * 1024, // 默认 10MB
            ),
          },
          fileFilter: (req, file, cb) => {
            // 获取允许的文件类型
            const allowedMimeTypes = configService.get<string[]>(
              'upload.allowedMimeTypes',
              [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
              ],
            );

            const allowedExtensions = configService.get<string[]>(
              'upload.allowedExtensions',
              [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp',
                '.pdf',
                '.doc',
                '.docx',
                '.xls',
                '.xlsx',
                '.txt',
                '.csv',
              ],
            );

            // 检查 MIME 类型
            const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
            // 检查文件扩展名
            const ext = extname(file.originalname).toLowerCase();
            const isExtAllowed = allowedExtensions.includes(ext);

            if (isMimeAllowed && isExtAllowed) {
              cb(null, true);
            } else {
              cb(
                new Error(
                  `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
                ),
                false,
              );
            }
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [UploadService],
  controllers: [UploadController, PublicFileController],
  exports: [UploadService],
})
export class UploadModule {}
