import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import {
  developmentHelmetConfig,
  productionHelmetConfig,
} from './common/security/helmet.config';

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

  // 配置 Helmet 安全头
  const helmetConfig =
    env === 'production' ? productionHelmetConfig : developmentHelmetConfig;
  app.use(helmet(helmetConfig));

  // 配置响应压缩
  app.use(
    compression({
      filter: (req: unknown, res: unknown) => {
        // 不压缩流式响应
        const response = res as {
          getHeader?: (name: string) => string | undefined;
        };
        if (response.getHeader && response.getHeader('x-no-compression')) {
          return false;
        }
        // 回退到标准过滤函数
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return compression.filter(req as any, res as any);
      },
      threshold: 1024, // 只压缩大于 1KB 的响应
    }),
  );

  // 配置全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除未在 DTO 中声明的属性
      transform: true, // 自动类型转换
      forbidNonWhitelisted: true, // 禁止非白名单属性
      errorHttpStatusCode: 400,
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    }),
  );

  // 配置全局响应转换拦截器
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // 配置 CORS
  const corsOrigins = configService.get<string[]>('app.corsOrigins', ['*']);
  app.enableCors({
    origin: env === 'production' ? corsOrigins : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Trace-Id, X-Request-Id',
  });

  // 配置 Swagger
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ACE NestJS Starter API')
      .setDescription(
        'ACE NestJS Starter - Production-ready NestJS scaffolding',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('roles', 'Role management endpoints')
      .addTag('permissions', 'Permission management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // 自定义 Swagger UI 选项
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // 保持授权状态
        tagsSorter: 'alpha', // 按字母顺序排序标签
        operationsSorter: 'alpha', // 按字母顺序排序操作
      },
      customSiteTitle: 'ACE NestJS API Docs',
      customCssUrl: undefined,
      customJs: undefined,
    });
  }

  // 监听 0.0.0.0 以便外部访问
  await app.listen(port, '0.0.0.0');

  // 显示启动信息
  console.log('');
  console.log('🚀 Application is running!');
  console.log('');
  console.log(`📍 Environment: ${env}`);
  console.log(`🌐 Local:       http://localhost:${port}`);
  console.log(`🌐 Network:     http://0.0.0.0:${port}`);
  if (env !== 'production') {
    console.log(`📚 Swagger:     http://localhost:${port}/api`);
  }
  console.log('');
}

void bootstrap();
