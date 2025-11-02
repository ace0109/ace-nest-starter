# 文件上传

## 概述

ACE NestJS Starter 提供了安全、高效的文件上传解决方案，支持本地存储和云存储。

## 核心特性

- **多种存储**: 本地、S3、阿里云 OSS
- **文件验证**: 类型、大小、数量限制
- **图片处理**: 缩略图、水印、压缩
- **断点续传**: 大文件分片上传
- **安全控制**: 防病毒扫描

## 基础配置

### Multer 配置

```typescript
// src/upload/upload.module.ts
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(
              null,
              file.fieldname +
                '-' +
                uniqueSuffix +
                path.extname(file.originalname),
            );
          },
        }),
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
        },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Invalid file type'), false);
          }
        },
      }),
    }),
  ],
})
export class UploadModule {}
```

## 文件上传

### 单文件上传

```typescript
@Controller('upload')
export class UploadController {
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
    };
  }
}
```

### 多文件上传

```typescript
@Post('multiple')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => ({
    filename: file.filename,
    url: `/uploads/${file.filename}`,
  }));
}
```

## 云存储集成

### AWS S3

```typescript
@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: configService.get('aws.accessKeyId'),
      secretAccessKey: configService.get('aws.secretAccessKey'),
      region: configService.get('aws.region'),
    });
  }

  async uploadToS3(file: Express.Multer.File) {
    const params = {
      Bucket: this.configService.get('aws.bucketName'),
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await this.s3.upload(params).promise();
    return { url: result.Location };
  }
}
```

## 图片处理

使用 Sharp 处理图片：

```typescript
@Injectable()
export class ImageService {
  async resizeImage(buffer: Buffer, width: number, height: number) {
    return sharp(buffer).resize(width, height).jpeg({ quality: 80 }).toBuffer();
  }

  async generateThumbnail(buffer: Buffer) {
    return sharp(buffer).resize(200, 200).toBuffer();
  }
}
```

## 安全最佳实践

1. 验证文件类型
2. 限制文件大小
3. 使用随机文件名
4. 隔离上传目录
5. 病毒扫描
6. 访问控制

## 下一步

- [安全最佳实践](./security.md) - 文件上传安全
- [性能优化](./performance.md) - 大文件处理
- [API 文档](../api/) - 上传 API
