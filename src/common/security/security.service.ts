import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * 安全服务
 * 提供加密、哈希、安全令牌生成等功能
 */
@Injectable()
export class SecurityService {
  /**
   * 生成安全的随机令牌
   * @param length 令牌长度（字节数，默认32）
   * @returns 十六进制格式的令牌字符串
   */
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成 URL 安全的随机令牌
   * @param length 令牌长度（字节数，默认32）
   * @returns Base64 URL 安全格式的令牌
   */
  generateUrlSafeToken(length = 32): string {
    return crypto
      .randomBytes(length)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * 生成安全的数字验证码
   * @param length 验证码长度（默认6）
   * @returns 数字验证码字符串
   */
  generateNumericCode(length = 6): string {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    const randomNum = crypto.randomInt(min, max + 1);
    return randomNum.toString();
  }

  /**
   * 生成混合字符验证码（字母+数字）
   * @param length 验证码长度（默认8）
   * @param options 配置选项
   * @returns 验证码字符串
   */
  generateMixedCode(
    length = 8,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      excludeConfusing?: boolean;
    } = {},
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      excludeConfusing = true,
    } = options;

    let chars = '';
    if (includeUppercase) {
      chars += excludeConfusing
        ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 排除 I, O
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (includeLowercase) {
      chars += excludeConfusing
        ? 'abcdefghjkmnpqrstuvwxyz' // 排除 i, l, o
        : 'abcdefghijklmnopqrstuvwxyz';
    }
    if (includeNumbers) {
      chars += excludeConfusing
        ? '23456789' // 排除 0, 1
        : '0123456789';
    }

    if (chars.length === 0) {
      throw new Error('At least one character type must be included');
    }

    let code = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
    }

    return code;
  }

  /**
   * 计算数据的 SHA256 哈希值
   * @param data 要哈希的数据
   * @returns 十六进制格式的哈希值
   */
  sha256Hash(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 计算数据的 SHA512 哈希值
   * @param data 要哈希的数据
   * @returns 十六进制格式的哈希值
   */
  sha512Hash(data: string | Buffer): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * 计算数据的 MD5 哈希值（仅用于非安全场景）
   * @param data 要哈希的数据
   * @returns 十六进制格式的哈希值
   */
  md5Hash(data: string | Buffer): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 使用 HMAC-SHA256 生成消息认证码
   * @param data 数据
   * @param secret 密钥
   * @returns 十六进制格式的 HMAC
   */
  hmacSha256(data: string | Buffer, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * AES-256-GCM 加密
   * @param plaintext 明文
   * @param password 密码
   * @returns 加密结果（包含 iv、authTag、encrypted）
   */
  encrypt(
    plaintext: string,
    password: string,
  ): {
    encrypted: string;
    iv: string;
    authTag: string;
    salt: string;
  } {
    // 生成盐值
    const salt = crypto.randomBytes(16);

    // 从密码派生密钥
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    // 生成初始化向量
    const iv = crypto.randomBytes(16);

    // 创建加密器
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // 加密数据
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 获取认证标签
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
    };
  }

  /**
   * AES-256-GCM 解密
   * @param encryptedData 加密数据
   * @param password 密码
   * @returns 解密后的明文
   */
  decrypt(
    encryptedData: {
      encrypted: string;
      iv: string;
      authTag: string;
      salt: string;
    },
    password: string,
  ): string {
    // 从十六进制恢复数据
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    // 从密码派生密钥
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    // 设置认证标签
    decipher.setAuthTag(authTag);

    // 解密数据
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 常量时间字符串比较（防止时序攻击）
   * @param a 字符串 A
   * @param b 字符串 B
   * @returns 是否相等
   */
  timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 强度评分和建议
   */
  checkPasswordStrength(password: string): {
    score: number;
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    suggestions: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // 长度检查
    if (password.length >= 8) score += 1;
    else suggestions.push('Password should be at least 8 characters');

    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 复杂度检查
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else suggestions.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 2;
    else suggestions.push('Add special characters');

    // 常见密码检查
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
    ];
    if (
      commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      score = Math.max(0, score - 3);
      suggestions.push('Avoid common passwords');
    }

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      suggestions.push('Avoid repeating characters');
    }

    // 确定强度等级
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 3) strength = 'weak';
    else if (score < 5) strength = 'medium';
    else if (score < 7) strength = 'strong';
    else strength = 'very-strong';

    return {
      score: Math.min(10, score),
      strength,
      suggestions,
    };
  }

  /**
   * 生成 CSRF Token
   * @returns CSRF Token
   */
  generateCsrfToken(): string {
    return this.generateUrlSafeToken(32);
  }

  /**
   * 验证 CSRF Token
   * @param token 提供的 token
   * @param expectedToken 预期的 token
   * @returns 是否有效
   */
  verifyCsrfToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false;
    }
    return this.timingSafeEqual(token, expectedToken);
  }

  /**
   * 清理用户输入（防止 XSS）
   * @param input 用户输入
   * @returns 清理后的输入
   */
  sanitizeInput(input: string): string {
    if (!input) return input;

    // 基础 HTML 转义
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 生成安全的文件名
   * @param filename 原始文件名
   * @returns 安全的文件名
   */
  sanitizeFilename(filename: string): string {
    if (!filename) return '';

    // 提取扩展名
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    const baseName =
      lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;

    // 清理基础文件名
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // 替换非法字符
      .replace(/_{2,}/g, '_') // 替换多个下划线
      .replace(/^_+|_+$/g, ''); // 去除首尾下划线

    // 限制长度
    const maxLength = 100;
    const truncated = sanitized.substring(0, maxLength);

    // 添加时间戳确保唯一性
    const timestamp = Date.now();
    const uniqueName = `${truncated}_${timestamp}`;

    return uniqueName + extension;
  }
}
