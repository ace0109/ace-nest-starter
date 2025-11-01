import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // 缓冲日志直到 Pino 准备就绪
  });

  // 使用 Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();

  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port', 3000);
  const env = configService.get<string>('app.env', 'development');

  // 配置全局响应转换拦截器
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

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
