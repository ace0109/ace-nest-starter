import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { WebSocketTestController } from './websocket-test.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const accessSecret = configService.get<string>('jwt.access.secret');
        if (!accessSecret) {
          throw new Error('JWT access secret is not configured');
        }

        const accessExpiresIn =
          configService.get<string | number>('jwt.access.expiresIn') ?? '2h';

        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: accessExpiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [WebSocketTestController],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
