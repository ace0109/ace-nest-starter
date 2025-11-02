/**
 * Helmet 配置
 * 提供各种安全 HTTP 头设置
 */
export const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger UI 需要
      styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI 需要
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },

  // 跨域资源共享
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' as const },
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },

  // DNS 预获取控制
  dnsPrefetchControl: { allow: false },

  // 期望证书透明度
  // expectCt: { maxAge: 86400, enforce: true },

  // 帧选项（防止点击劫持）
  frameguard: { action: 'deny' as const },

  // 隐藏 X-Powered-By 头
  hidePoweredBy: true,

  // HTTP 严格传输安全
  hsts: {
    maxAge: 31536000, // 1 年
    includeSubDomains: true,
    preload: true,
  },

  // IE 下载时不执行文件
  ieNoOpen: true,

  // 禁用 MIME 类型嗅探
  noSniff: true,

  // Origin-Agent-Cluster
  originAgentCluster: true,

  // 允许的域
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },

  // Referrer 策略
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },

  // XSS 过滤器
  xssFilter: true,
};

/**
 * 生产环境 Helmet 配置
 * 更严格的安全设置
 */
export const productionHelmetConfig = {
  ...helmetConfig,
  contentSecurityPolicy: {
    directives: {
      ...helmetConfig.contentSecurityPolicy.directives,
      scriptSrc: ["'self'"], // 生产环境禁用 unsafe-inline 和 unsafe-eval
      styleSrc: ["'self'"],
      upgradeInsecureRequests: [], // 强制 HTTPS
    },
  },
  hsts: {
    maxAge: 63072000, // 2 年
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * 开发环境 Helmet 配置
 * 较宽松的设置，便于开发调试
 */
export const developmentHelmetConfig = {
  ...helmetConfig,
  contentSecurityPolicy: false, // 开发环境禁用 CSP，便于调试
  hsts: false, // 开发环境禁用 HSTS
};
