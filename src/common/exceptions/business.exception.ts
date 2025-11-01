import { HttpException } from '@nestjs/common';
import {
  ErrorCode,
  ErrorMessage,
  getHttpStatusByErrorCode,
  ErrorCodeType,
} from '../constants/error-codes';

/**
 * 业务异常类
 * 用于抛出带有业务错误代码的异常
 */
export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCodeType;
  public readonly data?: unknown;
  public readonly errors?: unknown[];

  constructor(
    errorCode: ErrorCodeType,
    message?: string,
    data?: unknown,
    errors?: unknown[],
  ) {
    const httpStatus = getHttpStatusByErrorCode(errorCode);
    const errorMessage = message || ErrorMessage[errorCode] || 'Unknown error';

    super(
      {
        success: false,
        code: errorCode,
        message: errorMessage,
        data,
        errors,
      },
      httpStatus,
    );

    this.errorCode = errorCode;
    this.data = data;
    this.errors = errors;
  }

  /**
   * 创建验证错误异常
   */
  static validation(message?: string, errors?: unknown[]): BusinessException {
    return new BusinessException(
      ErrorCode.VALIDATION_ERROR,
      message || 'Validation failed',
      null,
      errors,
    );
  }

  /**
   * 创建未授权异常
   */
  static unauthorized(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.UNAUTHORIZED,
      message || 'Authentication required',
    );
  }

  /**
   * 创建禁止访问异常
   */
  static forbidden(message?: string): BusinessException {
    return new BusinessException(
      ErrorCode.PERMISSION_DENIED,
      message || 'Permission denied',
    );
  }

  /**
   * 创建资源未找到异常
   */
  static notFound(
    resource = 'Resource',
    id?: string | number,
  ): BusinessException {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    return new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, message);
  }

  /**
   * 创建资源已存在异常
   */
  static duplicate(resource = 'Resource', field?: string): BusinessException {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new BusinessException(ErrorCode.RESOURCE_ALREADY_EXISTS, message);
  }

  /**
   * 创建参数错误异常
   */
  static invalidParameter(
    parameter?: string,
    reason?: string,
  ): BusinessException {
    const message = parameter
      ? `Invalid parameter: ${parameter}${reason ? ` - ${reason}` : ''}`
      : 'Invalid parameter';
    return new BusinessException(ErrorCode.INVALID_PARAMETER, message);
  }

  /**
   * 创建缺失参数异常
   */
  static missingParameter(parameter: string): BusinessException {
    return new BusinessException(
      ErrorCode.MISSING_PARAMETER,
      `Missing required parameter: ${parameter}`,
    );
  }

  /**
   * 创建操作不允许异常
   */
  static operationNotAllowed(operation?: string): BusinessException {
    const message = operation
      ? `Operation not allowed: ${operation}`
      : 'Operation not allowed';
    return new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, message);
  }

  /**
   * 创建第三方服务错误异常
   */
  static thirdPartyError(
    service?: string,
    details?: unknown,
  ): BusinessException {
    const message = service
      ? `${service} service error`
      : 'Third-party service error';
    return new BusinessException(ErrorCode.THIRD_PARTY_ERROR, message, details);
  }

  /**
   * 创建数据库错误异常
   */
  static databaseError(
    operation?: string,
    details?: unknown,
  ): BusinessException {
    const message = operation
      ? `Database ${operation} failed`
      : 'Database operation failed';
    return new BusinessException(ErrorCode.DATABASE_ERROR, message, details);
  }

  /**
   * 创建请求参数错误异常
   */
  static badRequest(
    message = '请求参数错误',
    details?: unknown,
  ): BusinessException {
    return new BusinessException(ErrorCode.VALIDATION_ERROR, message, details);
  }
}
