/**
 * 错误代码常量定义
 * 采用混合方式：HTTP 状态码 + 业务错误代码
 *
 * 错误代码规则：
 * - 1xxxx: 系统级错误（内部错误、配置错误等）
 * - 2xxxx: 认证授权错误（登录、权限、令牌等）
 * - 3xxxx: 用户相关错误（用户不存在、用户操作错误等）
 * - 4xxxx: 业务逻辑错误（数据验证、业务规则等）
 * - 5xxxx: 第三方服务错误（外部API、支付、短信等）
 */

export const ErrorCode = {
  // 1xxxx - 系统级错误
  INTERNAL_SERVER_ERROR: 10000,
  DATABASE_ERROR: 10001,
  REDIS_ERROR: 10002,
  CONFIG_ERROR: 10003,
  SERVICE_UNAVAILABLE: 10004,
  REQUEST_TIMEOUT: 10005,
  TOO_MANY_REQUESTS: 10006,

  // 2xxxx - 认证授权错误
  UNAUTHORIZED: 20000,
  TOKEN_EXPIRED: 20001,
  TOKEN_INVALID: 20002,
  REFRESH_TOKEN_EXPIRED: 20003,
  REFRESH_TOKEN_INVALID: 20004,
  PERMISSION_DENIED: 20005,
  ACCOUNT_LOCKED: 20006,
  ACCOUNT_DISABLED: 20007,
  PASSWORD_INCORRECT: 20008,
  TWO_FACTOR_REQUIRED: 20009,
  TWO_FACTOR_INVALID: 20010,

  // 3xxxx - 用户相关错误
  USER_NOT_FOUND: 30001,
  USER_ALREADY_EXISTS: 30002,
  EMAIL_ALREADY_EXISTS: 30003,
  PHONE_ALREADY_EXISTS: 30004,
  USERNAME_ALREADY_EXISTS: 30005,
  USER_PROFILE_INCOMPLETE: 30006,
  USER_NOT_ACTIVATED: 30007,
  USER_BLOCKED: 30008,

  // 4xxxx - 业务逻辑错误
  VALIDATION_ERROR: 40000,
  INVALID_PARAMETER: 40001,
  MISSING_PARAMETER: 40002,
  DUPLICATE_ENTRY: 40003,
  RESOURCE_NOT_FOUND: 40004,
  RESOURCE_ALREADY_EXISTS: 40005,
  OPERATION_NOT_ALLOWED: 40006,
  BUSINESS_RULE_VIOLATION: 40007,
  DATA_INTEGRITY_ERROR: 40008,
  CONCURRENT_UPDATE_ERROR: 40009,
  INSUFFICIENT_BALANCE: 40010,
  QUOTA_EXCEEDED: 40011,

  // 5xxxx - 第三方服务错误
  THIRD_PARTY_ERROR: 50000,
  PAYMENT_SERVICE_ERROR: 50001,
  SMS_SERVICE_ERROR: 50002,
  EMAIL_SERVICE_ERROR: 50003,
  STORAGE_SERVICE_ERROR: 50004,
  OAUTH_SERVICE_ERROR: 50005,
  WECHAT_SERVICE_ERROR: 50006,
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 错误消息映射
 */
export const ErrorMessage: Record<ErrorCodeType, string> = {
  // 系统级错误
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.REDIS_ERROR]: 'Cache service error',
  [ErrorCode.CONFIG_ERROR]: 'Configuration error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.REQUEST_TIMEOUT]: 'Request timeout',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',

  // 认证授权错误
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.TOKEN_EXPIRED]: 'Access token expired',
  [ErrorCode.TOKEN_INVALID]: 'Invalid access token',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Refresh token expired',
  [ErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCode.PERMISSION_DENIED]: 'Permission denied',
  [ErrorCode.ACCOUNT_LOCKED]: 'Account is locked',
  [ErrorCode.ACCOUNT_DISABLED]: 'Account is disabled',
  [ErrorCode.PASSWORD_INCORRECT]: 'Incorrect password',
  [ErrorCode.TWO_FACTOR_REQUIRED]: 'Two-factor authentication required',
  [ErrorCode.TWO_FACTOR_INVALID]: 'Invalid two-factor authentication code',

  // 用户相关错误
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ErrorCode.PHONE_ALREADY_EXISTS]: 'Phone number already registered',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'Username already taken',
  [ErrorCode.USER_PROFILE_INCOMPLETE]: 'User profile is incomplete',
  [ErrorCode.USER_NOT_ACTIVATED]: 'User account not activated',
  [ErrorCode.USER_BLOCKED]: 'User account is blocked',

  // 业务逻辑错误
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_PARAMETER]: 'Invalid parameter',
  [ErrorCode.MISSING_PARAMETER]: 'Missing required parameter',
  [ErrorCode.DUPLICATE_ENTRY]: 'Duplicate entry',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ErrorCode.DATA_INTEGRITY_ERROR]: 'Data integrity error',
  [ErrorCode.CONCURRENT_UPDATE_ERROR]: 'Concurrent update conflict',
  [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance',
  [ErrorCode.QUOTA_EXCEEDED]: 'Quota exceeded',

  // 第三方服务错误
  [ErrorCode.THIRD_PARTY_ERROR]: 'Third-party service error',
  [ErrorCode.PAYMENT_SERVICE_ERROR]: 'Payment service error',
  [ErrorCode.SMS_SERVICE_ERROR]: 'SMS service error',
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'Email service error',
  [ErrorCode.STORAGE_SERVICE_ERROR]: 'Storage service error',
  [ErrorCode.OAUTH_SERVICE_ERROR]: 'OAuth service error',
  [ErrorCode.WECHAT_SERVICE_ERROR]: 'WeChat service error',
};

/**
 * 获取错误的 HTTP 状态码
 */
export function getHttpStatusByErrorCode(errorCode: ErrorCodeType): number {
  // 根据错误代码范围返回对应的 HTTP 状态码
  const codeRange = Math.floor(errorCode / 10000);

  switch (codeRange) {
    case 1: // 系统级错误
      if (errorCode === ErrorCode.SERVICE_UNAVAILABLE) return 503;
      if (errorCode === ErrorCode.REQUEST_TIMEOUT) return 408;
      if (errorCode === ErrorCode.TOO_MANY_REQUESTS) return 429;
      return 500;

    case 2: // 认证授权错误
      if (errorCode === ErrorCode.PERMISSION_DENIED) return 403;
      return 401;

    case 3: // 用户相关错误
      if (errorCode === ErrorCode.USER_NOT_FOUND) return 404;
      if (errorCode >= 30002 && errorCode <= 30005) return 409; // 已存在类错误
      return 400;

    case 4: // 业务逻辑错误
      if (errorCode === ErrorCode.RESOURCE_NOT_FOUND) return 404;
      if (
        errorCode === ErrorCode.DUPLICATE_ENTRY ||
        errorCode === ErrorCode.RESOURCE_ALREADY_EXISTS
      )
        return 409;
      if (errorCode === ErrorCode.OPERATION_NOT_ALLOWED) return 403;
      return 400;

    case 5: // 第三方服务错误
      return 502; // Bad Gateway

    default:
      return 500;
  }
}
