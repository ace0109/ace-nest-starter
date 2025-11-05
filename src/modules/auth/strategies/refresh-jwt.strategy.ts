import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../../common/exceptions/business.exception';

interface RefreshJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    const refreshSecret = configService.get<string>('jwt.refresh.secret');
    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
    });
  }

  validate(payload: RefreshJwtPayload) {
    if (!payload.sub || !payload.email) {
      throw BusinessException.unauthorized('无效的刷新令牌');
    }

    // 返回的值会被注入到 req.user
    return {
      sub: payload.sub,
      email: payload.email,
    };
  }
}
