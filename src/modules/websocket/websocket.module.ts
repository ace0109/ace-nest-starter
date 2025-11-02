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
        const accessSecret =
          configService.get<string>('jwt.accessSecret') || 'default-secret';
        const accessExpiresIn =
          configService.get<string>('jwt.accessExpiresIn') || '15m';
        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: accessExpiresIn as unknown as number,
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
