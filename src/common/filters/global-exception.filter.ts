import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ErrorCode, ErrorCodeType } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';

// 扩展 Request 接口以包含 id 属性
interface RequestWithTraceId extends Request {
  id: string;
}

/**
 * 统一错误响应格式
 */
export interface ErrorResponse {
  success: false;
  code: number;
  message: string;
  statusCode: number;
  timestamp: number;
  traceId: string;
  path: string;
  method: string;
  errors?: unknown[];
  stack?: string;
}

// Prisma 错误接口
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string;
  };
}

// 验证响应接口
interface ValidationErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * 全局异常过滤器
 * 捕获所有异常并返回统一格式的错误响应
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly pinoLogger: PinoLogger) {
    this.pinoLogger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取 traceId（从 pino logger 的 request 对象中获取）
    const traceId = (request as RequestWithTraceId).id ?? 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: ErrorCodeType = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown[] | undefined;
    let stack: string | undefined;

    // 处理不同类型的异常
    if (exception instanceof BusinessException) {
      // 业务异常
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      const exceptionResponse =
        exception.getResponse() as ValidationErrorResponse;
      message = (exceptionResponse.message as string) ?? message;
      errors = exception.errors;
      stack = this.getStackTrace(exception);

      // 业务异常记录为警告级别
      this.pinoLogger.warn(
        {
          err: exception,
          errorCode,
          statusCode,
          path: request.path,
          method: request.method,
          traceId,
        },
        `Business exception: ${message}`,
      );
    } else if (exception instanceof HttpException) {
      // NestJS 内置 HTTP 异常
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 处理验证管道的错误
      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const responseObj = exceptionResponse as ValidationErrorResponse;
        message = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : (responseObj.message ?? message);

        // 如果是验证错误，设置对应的错误代码
        if (statusCode === HttpStatus.BAD_REQUEST) {
          errorCode = ErrorCode.VALIDATION_ERROR;
          errors = Array.isArray(responseObj.message)
            ? responseObj.message
            : undefined;
        }
      } else {
        message = exception.message;
      }

      // 根据状态码映射错误代码
      errorCode = this.mapHttpStatusToErrorCode(statusCode, errorCode);
      stack = this.getStackTrace(exception);

      // HTTP 异常记录为警告级别
      this.pinoLogger.warn(
        {
          err: exception,
          errorCode,
          statusCode,
          path: request.path,
          method: request.method,
          traceId,
        },
        `HTTP exception: ${message}`,
      );
    } else if (exception instanceof Error) {
      // 普通 Error 对象
      message = exception.message || message;
      stack = this.getStackTrace(exception);

      // 检查是否是 Prisma 错误
      if (this.isPrismaError(exception)) {
        errorCode = ErrorCode.DATABASE_ERROR;
        message = this.getPrismaErrorMessage(exception);
        statusCode = HttpStatus.BAD_REQUEST;
      }

      // 系统错误记录为错误级别
      this.pinoLogger.error(
        {
          err: exception,
          errorCode,
          statusCode,
          path: request.path,
          method: request.method,
          traceId,
        },
        `System error: ${message}`,
      );
    } else {
      // 未知类型的异常
      message = 'Unknown error occurred';

      // 未知错误记录为错误级别
      this.pinoLogger.error(
        {
          exception,
          errorCode,
          statusCode,
          path: request.path,
          method: request.method,
          traceId,
        },
        `Unknown error: ${message}`,
      );
    }

    // 构造错误响应
    const errorResponse: ErrorResponse = {
      success: false,
      code: errorCode,
      message,
      statusCode,
      timestamp: Date.now(),
      traceId,
      path: request.path,
      method: request.method,
      errors,
    };

    // 在开发环境添加堆栈信息
    if (process.env.NODE_ENV === 'development' && stack) {
      errorResponse.stack = stack;
    }

    // 发送错误响应
    response.status(statusCode).json(errorResponse);
  }

  /**
   * 根据 HTTP 状态码映射错误代码
   */
  private mapHttpStatusToErrorCode(
    statusCode: number,
    defaultCode: ErrorCodeType,
  ): ErrorCodeType {
    // 使用数字直接比较，避免枚举类型不匹配问题
    switch (statusCode) {
      case 401: // HttpStatus.UNAUTHORIZED
        return ErrorCode.UNAUTHORIZED;
      case 403: // HttpStatus.FORBIDDEN
        return ErrorCode.PERMISSION_DENIED;
      case 404: // HttpStatus.NOT_FOUND
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 409: // HttpStatus.CONFLICT
        return ErrorCode.DUPLICATE_ENTRY;
      case 429: // HttpStatus.TOO_MANY_REQUESTS
        return ErrorCode.TOO_MANY_REQUESTS;
      case 408: // HttpStatus.REQUEST_TIMEOUT
        return ErrorCode.REQUEST_TIMEOUT;
      case 503: // HttpStatus.SERVICE_UNAVAILABLE
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return defaultCode;
    }
  }

  /**
   * 检查是否是 Prisma 错误
   */
  private isPrismaError(error: unknown): error is PrismaError {
    return (
      error instanceof Error &&
      'code' in error &&
      typeof error.code === 'string' &&
      error.code.startsWith('P')
    );
  }

  /**
   * 获取 Prisma 错误的友好消息
   */
  private getPrismaErrorMessage(error: PrismaError): string {
    const prismaErrorMap: Record<string, string> = {
      P2000: 'The provided value for the column is too long',
      P2001: 'The record searched for in the where condition does not exist',
      P2002: 'Unique constraint failed',
      P2003: 'Foreign key constraint failed',
      P2004: 'A constraint failed on the database',
      P2005: 'The value stored in the database is invalid for the field type',
      P2006: 'The provided value is not valid',
      P2007: 'Data validation error',
      P2008: 'Failed to parse the query',
      P2009: 'Failed to validate the query',
      P2010: 'Raw query failed',
      P2011: 'Null constraint violation',
      P2012: 'Missing a required value',
      P2013: 'Missing the required argument',
      P2014: 'The change would violate the required relation',
      P2015: 'A related record could not be found',
      P2016: 'Query interpretation error',
      P2017: 'The records for relation are not connected',
      P2018: 'The required connected records were not found',
      P2019: 'Input error',
      P2020: 'Value out of range',
      P2021: 'The table does not exist',
      P2022: 'The column does not exist',
      P2023: 'Inconsistent column data',
      P2024: 'Timed out fetching a new connection from the pool',
      P2025:
        'An operation failed because it depends on one or more records that were required but not found',
      P2026: "The current database provider doesn't support a feature",
      P2027: 'Multiple errors occurred during query execution',
      P2028: 'Transaction API error',
      P2030: 'Cannot find a fulltext index to use for the search',
      P2033: 'A number used in the query does not fit',
      P2034: 'Transaction failed due to a write conflict or deadlock',
    };

    if (error.code && prismaErrorMap[error.code]) {
      const baseMessage = prismaErrorMap[error.code];
      // 添加元数据信息（如果有）
      if (error.meta?.target) {
        return `${baseMessage} on field(s): ${error.meta.target}`;
      }
      return baseMessage;
    }

    return error.message || 'Database operation failed';
  }

  /**
   * 获取堆栈跟踪（仅在开发环境）
   */
  private getStackTrace(exception: Error): string | undefined {
    if (process.env.NODE_ENV === 'development') {
      return exception.stack;
    }
    return undefined;
  }
}
