import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new UsersService(prisma);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a user with hashed password and omits password in response', async () => {
    const hashMock = bcrypt.hash as unknown as jest.Mock;
    hashMock.mockResolvedValue('hashed-password');

    prisma.user.create.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      username: 'user',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      email: 'user@example.com',
      username: 'user',
      password: 'plain',
    } as any);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'user@example.com',
        username: 'user',
        password: 'hashed-password',
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        email: 'user@example.com',
        username: 'user',
      }),
    );
    expect((result as any).password).toBeUndefined();
  });

  it('throws ConflictException when unique constraint is violated on create', async () => {
    const hashMock = bcrypt.hash as unknown as jest.Mock;
    hashMock.mockResolvedValue('hashed-password');

    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '1.0.0',
      meta: { target: ['email'] },
    } as any);

    prisma.user.create.mockRejectedValue(prismaError);

    await expect(
      service.create({ email: 'user@example.com', username: 'user', password: 'plain' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when updating with duplicate phone', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      username: 'user',
    });

    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '1.0.0',
      meta: { target: ['phone'] },
    } as any);

    prisma.user.update.mockRejectedValue(prismaError);

    await expect(
      service.update('1', { phone: '13800138000' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
