import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AuthService(
      {
        findOne: jest.fn(),
        findByEmail: jest.fn(),
      } as any,
      jwtService,
      configService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses human readable expiration values', () => {
    const result = (service as any).parseExpireTime('15m', 'access', 0);
    expect(result).toBe(900);

    const numeric = (service as any).parseExpireTime('3600', 'access', 0);
    expect(numeric).toBe(3600);
  });

  it('falls back to default and logs warning for invalid expiration values', () => {
    const logger = (service as any).logger as Logger;
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation();

    const fallback = (service as any).parseExpireTime('invalid', 'access', 120);

    expect(fallback).toBe(120);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid access expiration value'),
    );
  });

  it('generates tokens using configured refresh secret and expiry', async () => {
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case 'jwt.refreshExpiresIn':
          return '7d';
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        case 'jwt.accessExpiresIn':
          return '15m';
        default:
          return defaultValue;
      }
    });

    jwtService.signAsync.mockResolvedValueOnce('access-token');
    jwtService.signAsync.mockResolvedValueOnce('refresh-token');

    const payload = { sub: '1', email: 'user@example.com', username: 'user' };

    const tokens = await (service as any).generateTokens(payload);

    expect(tokens.refreshToken).toBe('refresh-token');
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, expect.anything(), {
      secret: 'refresh-secret',
      expiresIn: '7d',
    });
  });

  it('throws when refresh secret is missing', async () => {
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'jwt.refreshSecret') {
        return undefined;
      }
      if (key === 'jwt.refreshExpiresIn') {
        return '7d';
      }
      return defaultValue;
    });

    const payload = { sub: '1', email: 'user@example.com', username: 'user' };

    await expect((service as any).generateTokens(payload)).rejects.toThrow(
      'Refresh token secret is not configured',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
