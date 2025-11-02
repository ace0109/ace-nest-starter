import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from './common/decorators/auth.decorators';
import { DataMaskingService } from './common/security/data-masking.service';
import { SecurityService } from './common/security/security.service';

/**
 * 安全功能测试控制器
 */
@ApiTags('test-security')
@Controller('test/security')
@Public()
export class SecurityTestController {
  constructor(
    private readonly dataMaskingService: DataMaskingService,
    private readonly securityService: SecurityService,
  ) {}

  /**
   * 测试数据脱敏
   */
  @Post('mask')
  @ApiOperation({ summary: '测试数据脱敏' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        phone: { type: 'string', example: '13812345678' },
        idCard: { type: 'string', example: '110101199001011234' },
        bankCard: { type: 'string', example: '6222000012340000' },
        name: { type: 'string', example: '张三丰' },
        address: { type: 'string', example: '北京市朝阳区某某街道123号' },
        password: { type: 'string', example: 'MyPassword123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '脱敏后的数据',
  })
  testDataMasking(@Body() data: Record<string, string>) {
    return {
      original: data,
      masked: {
        email: this.dataMaskingService.maskEmail(data.email || ''),
        phone: this.dataMaskingService.maskPhoneNumber(data.phone || ''),
        idCard: this.dataMaskingService.maskIdCard(data.idCard || ''),
        bankCard: this.dataMaskingService.maskBankCard(data.bankCard || ''),
        name: this.dataMaskingService.maskName(data.name || ''),
        address: this.dataMaskingService.maskAddress(data.address || ''),
        password: this.dataMaskingService.maskPassword(),
      },
      autoMasked: this.dataMaskingService.maskObject(data),
    };
  }

  /**
   * 测试密码强度检查
   */
  @Post('password-strength')
  @ApiOperation({ summary: '测试密码强度' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', example: 'MySecureP@ssw0rd!' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '密码强度评估结果',
  })
  testPasswordStrength(@Body('password') password: string) {
    return this.securityService.checkPasswordStrength(password);
  }

  /**
   * 生成安全令牌
   */
  @Get('generate-token')
  @ApiOperation({ summary: '生成各种类型的安全令牌' })
  @ApiResponse({
    status: 200,
    description: '生成的令牌',
  })
  generateTokens() {
    return {
      secureToken: this.securityService.generateSecureToken(),
      urlSafeToken: this.securityService.generateUrlSafeToken(),
      numericCode: this.securityService.generateNumericCode(6),
      mixedCode: this.securityService.generateMixedCode(8),
      csrfToken: this.securityService.generateCsrfToken(),
    };
  }

  /**
   * 测试加密解密
   */
  @Post('encrypt-decrypt')
  @ApiOperation({ summary: '测试数据加密解密' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        plaintext: { type: 'string', example: 'This is sensitive data' },
        password: { type: 'string', example: 'MyEncryptionPassword123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '加密和解密结果',
  })
  testEncryptDecrypt(@Body() data: { plaintext: string; password: string }) {
    const encrypted = this.securityService.encrypt(
      data.plaintext,
      data.password,
    );
    const decrypted = this.securityService.decrypt(encrypted, data.password);

    return {
      original: data.plaintext,
      encrypted: encrypted,
      decrypted: decrypted,
      match: data.plaintext === decrypted,
    };
  }

  /**
   * 测试哈希功能
   */
  @Post('hash')
  @ApiOperation({ summary: '测试各种哈希算法' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string', example: 'Hello World' },
        secret: { type: 'string', example: 'MySecret123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '哈希结果',
  })
  testHash(@Body() data: { data: string; secret: string }) {
    return {
      sha256: this.securityService.sha256Hash(data.data),
      sha512: this.securityService.sha512Hash(data.data),
      md5: this.securityService.md5Hash(data.data),
      hmacSha256: this.securityService.hmacSha256(data.data, data.secret),
    };
  }

  /**
   * 测试输入清理（XSS 防护）
   */
  @Post('sanitize')
  @ApiOperation({ summary: '测试输入清理（XSS 防护）' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          example: '<script>alert("XSS")</script>',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '清理后的输入',
  })
  testSanitize(@Body('input') input: string) {
    return {
      original: input,
      sanitized: this.securityService.sanitizeInput(input),
    };
  }

  /**
   * 测试文件名清理
   */
  @Post('sanitize-filename')
  @ApiOperation({ summary: '测试文件名清理' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          example: '../../../etc/passwd.txt',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '清理后的文件名',
  })
  testSanitizeFilename(@Body('filename') filename: string) {
    return {
      original: filename,
      sanitized: this.securityService.sanitizeFilename(filename),
    };
  }

  /**
   * 检查安全头
   */
  @Get('headers')
  @ApiOperation({ summary: '检查响应安全头' })
  @ApiResponse({
    status: 200,
    description: '当前请求的安全相关头信息',
  })
  checkSecurityHeaders(@Headers() headers: Record<string, string>) {
    // 提取安全相关的请求头
    const securityHeaders: Record<string, string> = {};
    const securityHeaderKeys = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'x-powered-by',
      'referrer-policy',
      'x-download-options',
      'x-permitted-cross-domain-policies',
    ];

    for (const key of securityHeaderKeys) {
      if (headers[key]) {
        securityHeaders[key] = headers[key];
      }
    }

    return {
      message:
        'Check the response headers in your browser DevTools or API client',
      requestHeaders: securityHeaders,
      note: 'Security headers are set in the response, not the request. Use browser DevTools Network tab to inspect them.',
    };
  }

  /**
   * 测试 CORS 设置
   */
  @Get('cors-test')
  @ApiOperation({ summary: '测试 CORS 配置' })
  @ApiResponse({
    status: 200,
    description: 'CORS 测试结果',
  })
  testCors(@Headers('origin') origin: string) {
    return {
      message: 'CORS test endpoint',
      receivedOrigin: origin || 'No origin header',
      note: 'Check the response headers for CORS configuration',
    };
  }

  /**
   * 生成 CSRF Token
   */
  @Get('csrf-token')
  @ApiOperation({ summary: '生成 CSRF Token' })
  @ApiResponse({
    status: 200,
    description: 'CSRF Token',
  })
  generateCsrfToken() {
    const token = this.securityService.generateCsrfToken();
    return {
      csrfToken: token,
      usage: 'Include this token in your form submissions or AJAX requests',
    };
  }

  /**
   * 验证 CSRF Token
   */
  @Post('verify-csrf')
  @ApiOperation({ summary: '验证 CSRF Token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'your-csrf-token' },
        expectedToken: { type: 'string', example: 'expected-csrf-token' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF Token 验证结果',
  })
  verifyCsrfToken(@Body() data: { token: string; expectedToken: string }) {
    const isValid = this.securityService.verifyCsrfToken(
      data.token,
      data.expectedToken,
    );
    return {
      valid: isValid,
      message: isValid ? 'CSRF token is valid' : 'CSRF token is invalid',
    };
  }
}
