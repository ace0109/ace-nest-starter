import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { v7 as uuidv7 } from 'uuid';

/**
 * Pino 日志配置
 * 开发环境: 彩色文本格式 (pino-pretty)
 * 生产环境: JSON 结构化格式
 */
export const loggerConfig: Params = {
  pinoHttp: {
    // 使用 UUID v7 生成请求 ID (带时间戳的 UUID)
    genReqId: (req: IncomingMessage) => {
      // 优先使用客户端传入的 X-Request-ID
      const existingId = req.headers['x-request-id'];
      if (existingId && typeof existingId === 'string') {
        return existingId;
      }
      return uuidv7();
    },

    // 自定义请求属性
    customProps: (req: IncomingMessage) => ({
      // genReqId 确保返回的 req.id 始终是 string 类型 (UUID v7)
      traceId: req.id as string,
    }),

    // 自定义日志级别
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },

    // 自定义成功日志消息
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    // 自定义错误日志消息
    customErrorMessage: (
      _req: IncomingMessage,
      _res: ServerResponse,
      err: Error,
    ) => {
      return `Error: ${err.message}`;
    },

    // 序列化器 - 控制日志输出内容
    serializers: {
      req: (req: IncomingMessage) => {
        // Express 扩展了 IncomingMessage，添加了 query 和 params
        const expressReq = req as IncomingMessage & {
          query?: Record<string, unknown>;
          params?: Record<string, unknown>;
        };

        return {
          id: req.id,
          method: req.method,
          url: req.url,
          query: expressReq.query,
          params: expressReq.params,
          // 敏感信息脱敏
          headers: sanitizeHeaders(req.headers),
          remoteAddress: req.socket?.remoteAddress,
          remotePort: req.socket?.remotePort,
        };
      },
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
      }),
    },

    // 开发环境使用 pino-pretty 美化输出
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              messageFormat: '{traceId} - {msg}',
              singleLine: false,
            },
          }
        : undefined,

    // 日志级别
    level: process.env.LOG_LEVEL || 'info',

    // 生产环境额外配置
    ...(process.env.NODE_ENV === 'production' && {
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.confirmPassword',
          'req.body.oldPassword',
          'req.body.newPassword',
        ],
        censor: '***REDACTED***',
      },
    }),
  },
};

/**
 * 敏感信息脱敏 - 请求头
 */
function sanitizeHeaders(
  headers: IncomingMessage['headers'],
): Record<string, string | string[] | undefined> {
  const sanitized = { ...headers };

  // 脱敏敏感请求头
  if (sanitized.authorization) {
    sanitized.authorization = '***';
  }
  if (sanitized.cookie) {
    sanitized.cookie = '***';
  }
  if (sanitized['x-api-key']) {
    sanitized['x-api-key'] = '***';
  }

  return sanitized;
}
