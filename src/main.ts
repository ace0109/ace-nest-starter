import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port', 3000);
  const env = configService.get<string>('app.env', 'development');

  // 监听 0.0.0.0 以便外部访问
  await app.listen(port, '0.0.0.0');

  // 显示启动信息
  console.log('');
  console.log('🚀 Application is running!');
  console.log('');
  console.log(`📍 Environment: ${env}`);
  console.log(`🌐 Local:       http://localhost:${port}`);
  console.log(`🌐 Network:     http://0.0.0.0:${port}`);
  console.log('');
}

void bootstrap();
