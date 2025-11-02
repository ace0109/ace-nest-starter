import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

/**
 * 国际化异常过滤器
 * 将异常消息转换为对应语言
 */
@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & {
        url: string;
        method: string;
        headers: Record<string, string>;
        id?: string;
      }
    >();
    const i18n = I18nContext.current();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = this.translateMessage(exceptionResponse, i18n);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string;
          error?: string;
          errors?: Record<string, unknown>;
        };
        message = this.translateMessage(
          responseObj.message || responseObj.error || 'Error',
          i18n,
        );
        errors = responseObj.errors;

        // 翻译验证错误
        if (errors && typeof errors === 'object') {
          errors = this.translateValidationErrors(errors, i18n);
        }
      }
    } else if (exception instanceof Error) {
      message = this.translateMessage(exception.message, i18n);
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      message = this.translateMessage('Unknown error occurred', i18n);
      this.logger.error('Unknown error occurred', exception);
    }

    // 获取错误代码对应的翻译
    const translatedStatusMessage = this.translateHttpStatus(status, i18n);

    const errorResponse = {
      success: false,
      statusCode: status,
      message: translatedStatusMessage || message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      traceId: request.headers['x-trace-id'] || request.id,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 翻译消息
   */
  private translateMessage(
    message: string,
    i18n: I18nContext | undefined,
  ): string {
    if (!i18n || !message) {
      return message;
    }

    // 尝试将消息作为 i18n key 进行翻译
    try {
      // 检查是否是已知的错误消息 key
      const knownKeys = [
        'auth.invalidCredentials',
        'auth.accountNotFound',
        'auth.accountDisabled',
        'auth.accountLocked',
        'auth.tokenExpired',
        'auth.tokenInvalid',
        'auth.unauthorized',
        'auth.forbidden',
        'auth.sessionExpired',
        'auth.emailExists',
        'auth.usernameExists',
        'user.userNotFound',
        'user.updateFailed',
        'user.deleteFailed',
        'file.fileNotFound',
        'file.uploadFailed',
        'file.deleteFailed',
        'file.fileTooLarge',
        'file.invalidFileType',
        'email.sendFailed',
      ];

      // 检查消息是否匹配已知的 key
      for (const key of knownKeys) {
        if (message.toLowerCase().includes(key.split('.')[1].toLowerCase())) {
          const translated = i18n.t(key);
          if (translated !== key) {
            return translated as string;
          }
        }
      }

      // 尝试直接翻译
      const directTranslation = i18n.t(message, {
        defaultValue: message,
      });
      if (directTranslation !== message) {
        return directTranslation as string;
      }

      // 如果是数组消息，翻译每一项
      if (Array.isArray(message)) {
        return message
          .map((msg) =>
            typeof msg === 'string'
              ? this.translateMessage(msg, i18n)
              : String(msg),
          )
          .join(', ');
      }

      return message;
    } catch {
      return message;
    }
  }

  /**
   * 翻译 HTTP 状态码
   */
  private translateHttpStatus(
    status: number,
    i18n: I18nContext | undefined,
  ): string | null {
    if (!i18n) {
      return null;
    }

    try {
      const key = `error.${status}`;
      const translated = i18n.t(key);
      return translated !== key ? (translated as string) : null;
    } catch {
      return null;
    }
  }

  /**
   * 翻译验证错误
   */
  private translateValidationErrors(
    errors: Record<string, unknown>,
    i18n: I18nContext | undefined,
  ): Record<string, unknown> {
    if (!i18n || !errors) {
      return errors;
    }

    if (typeof errors === 'object') {
      const translated: Record<string, unknown> = {};

      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages)) {
          translated[field] = messages.map((msg) => {
            if (typeof msg === 'string') {
              return this.translateValidationMessage(msg, field, i18n);
            }
            return msg as unknown;
          });
        } else if (typeof messages === 'string') {
          translated[field] = this.translateValidationMessage(
            messages,
            field,
            i18n,
          );
        } else {
          translated[field] = messages;
        }
      }

      return translated;
    }

    return errors;
  }

  /**
   * 翻译验证消息
   */
  private translateValidationMessage(
    message: string,
    field: string,
    i18n: I18nContext,
  ): string {
    // 验证消息模式映射
    const patterns = [
      { pattern: /must not be empty/i, key: 'validation.required' },
      { pattern: /must be an? email/i, key: 'validation.email' },
      {
        pattern: /must be longer than or equal to (\d+)/i,
        key: 'validation.minLength',
      },
      {
        pattern: /must be shorter than or equal to (\d+)/i,
        key: 'validation.maxLength',
      },
      { pattern: /must not be less than (\d+)/i, key: 'validation.min' },
      { pattern: /must not be greater than (\d+)/i, key: 'validation.max' },
      { pattern: /must be a number/i, key: 'validation.number' },
      { pattern: /must be an? integer/i, key: 'validation.integer' },
      { pattern: /must be a positive number/i, key: 'validation.positive' },
      { pattern: /must be a boolean/i, key: 'validation.boolean' },
      { pattern: /must be an? array/i, key: 'validation.array' },
      { pattern: /must be an? object/i, key: 'validation.object' },
      { pattern: /must be a valid enum value/i, key: 'validation.enum' },
      {
        pattern: /must be a strong password/i,
        key: 'validation.strongPassword',
      },
      { pattern: /must be a valid phone number/i, key: 'validation.phone' },
      { pattern: /must be a valid URL/i, key: 'validation.url' },
      { pattern: /must be a valid date/i, key: 'validation.date' },
    ];

    const fieldName = i18n.t(`fields.${field}`, {
      defaultValue: field,
    });

    for (const { pattern, key } of patterns) {
      const match = message.match(pattern);
      if (match) {
        const args: Record<string, unknown> = { field: fieldName };

        // 提取数字参数
        if (match[1]) {
          if (key.includes('min')) {
            args.min = match[1];
          } else if (key.includes('max')) {
            args.max = match[1];
          }
        }

        const translated = i18n.t(key, args);
        if (translated !== key) {
          return translated as string;
        }
      }
    }

    // 如果没有匹配的模式，返回原消息
    return message;
  }
}
