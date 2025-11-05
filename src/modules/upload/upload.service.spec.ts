import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { FileCategory } from './dto/upload.dto';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let configService: jest.Mocked<ConfigService>;
  let prisma: any;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    prisma = {
      file: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'upload.path') {
        return 'uploads';
      }
      if (key === 'app.url') {
        return 'http://localhost:3000';
      }
      return defaultValue;
    });

    service = new UploadService(configService, prisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persists uploaded file metadata via Prisma', async () => {
    const cwd = process.cwd();
    const filePath = join(cwd, 'uploads/2024/12/mock.png');
    const mockFile = {
      originalname: 'mock.png',
      filename: 'uuid.png',
      mimetype: 'image/png',
      size: 1024,
      path: filePath,
    } as any;

    const storedFile = {
      id: 'file-1',
      originalName: 'mock.png',
      filename: 'uuid.png',
      path: '2024/12/mock.png',
      mimeType: 'image/png',
      size: 1024,
      category: FileCategory.IMAGE,
      description: 'example',
      isPublic: true,
      uploaderId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.file.create.mockResolvedValue(storedFile);

    const result = await service.uploadFile(
      mockFile,
      { description: 'example', isPublic: true },
      'user-1',
    );

    expect(prisma.file.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        path: '2024/12/mock.png',
        uploaderId: 'user-1',
        isPublic: true,
      }),
    });
    expect(result.url).toBe('http://localhost:3000/uploads/2024/12/mock.png');
    expect(result.category).toBe(FileCategory.IMAGE);
  });

  it('guards private files from unauthorized access', async () => {
    prisma.file.findUnique.mockResolvedValue({
      id: 'file-1',
      originalName: 'mock.png',
      filename: 'uuid.png',
      path: '2024/12/mock.png',
      mimeType: 'image/png',
      size: 1024,
      category: FileCategory.IMAGE,
      description: null,
      isPublic: false,
      uploaderId: 'owner-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.getFileById('file-1', 'another-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('calculates storage statistics using database aggregation', async () => {
    prisma.file.count.mockResolvedValue(3);
    prisma.file.aggregate.mockResolvedValue({ _sum: { size: 4500 } });
    prisma.file.groupBy.mockResolvedValue([
      { category: FileCategory.IMAGE, _count: { _all: 2 }, _sum: { size: 3000 } },
      { category: FileCategory.DOCUMENT, _count: { _all: 1 }, _sum: { size: 1500 } },
    ]);

    const stats = await service.getStorageStats('user-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(stats.totalFiles).toBe(3);
    expect(stats.totalSize).toBe(4500);
    expect(stats.byCategory[FileCategory.IMAGE]).toEqual({ count: 2, size: 3000 });
    expect(stats.byCategory[FileCategory.DOCUMENT]).toEqual({ count: 1, size: 1500 });
  });

  it('cleans up expired temporary files and removes physical artifacts', async () => {
    const files = [
      {
        id: 'file-1',
        path: '2024/11/mock.png',
        size: 1024,
      },
      {
        id: 'file-2',
        path: '2024/10/mock.png',
        size: 2048,
      },
    ];

    prisma.file.findMany.mockResolvedValue(files);
    prisma.file.deleteMany.mockResolvedValue({ count: files.length });

    const deleteSpy = jest
      .spyOn<any, any>(service as any, 'deletePhysicalFile')
      .mockImplementation(() => undefined);

    const result = await service.cleanupExpiredFiles(30);

    expect(prisma.file.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['file-1', 'file-2'] } },
    });
    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ deletedCount: 2, freedSpace: 3072 });
  });
});
