import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService log configuration', () => {
  const resolver = (PrismaService as any).resolveLogDefinitions as (
    config: ConfigService,
  ) => Prisma.LogDefinition[];

  it('returns only error logs in production by default', () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'app.env') {
          return 'production';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const logs = resolver(config);

    expect(logs).toEqual([{ emit: 'stdout', level: 'error' }]);
  });

  it('honors explicit log level configuration', () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'database.logLevels') {
          return ['query', 'warn', 'invalid'];
        }
        if (key === 'app.env') {
          return 'production';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const logs = resolver(config);

    expect(logs).toEqual([
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'warn' },
    ]);
  });
});
