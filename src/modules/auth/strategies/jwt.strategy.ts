import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const accessSecret = configService.get<string>('jwt.access.secret');
    if (!accessSecret) {
      throw new Error('JWT access secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  validate(payload: JwtPayload) {
    // 这个方法会在JWT验证通过后调用
    // 返回的值会被注入到 req.user
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles || [],
    };
  }
}
