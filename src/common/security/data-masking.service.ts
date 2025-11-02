import { Injectable } from '@nestjs/common';

/**
 * 数据脱敏服务
 * 提供各种敏感数据的脱敏功能
 */
@Injectable()
export class DataMaskingService {
  /**
   * 脱敏邮箱地址
   * 例如: example@gmail.com -> ex***@gmail.com
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return email;
    }

    const [localPart, domain] = email.split('@');
    const visibleChars = Math.min(2, Math.floor(localPart.length / 2));
    const maskedLocal =
      localPart.substring(0, visibleChars) +
      '***' +
      (localPart.length > visibleChars ? '' : '');

    return `${maskedLocal}@${domain}`;
  }

  /**
   * 脱敏手机号码
   * 例如: 13812345678 -> 138****5678
   */
  maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 7) {
      return phone;
    }

    // 清理非数字字符
    const cleaned = phone.replace(/\D/g, '');

    // 中国手机号脱敏
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(0, 3) + '****' + cleaned.substring(7);
    }

    // 通用脱敏：显示前3位和后4位
    if (cleaned.length >= 7) {
      const visibleStart = Math.min(3, Math.floor(cleaned.length / 3));
      const visibleEnd = Math.min(4, Math.floor(cleaned.length / 3));
      return (
        cleaned.substring(0, visibleStart) +
        '****' +
        cleaned.substring(cleaned.length - visibleEnd)
      );
    }

    return phone;
  }

  /**
   * 脱敏身份证号
   * 例如: 110101199001011234 -> 110***********1234
   */
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 8) {
      return idCard;
    }

    // 18位身份证
    if (idCard.length === 18) {
      return idCard.substring(0, 3) + '***********' + idCard.substring(14);
    }

    // 15位身份证
    if (idCard.length === 15) {
      return idCard.substring(0, 3) + '********' + idCard.substring(11);
    }

    // 通用脱敏
    const visibleStart = 3;
    const visibleEnd = 4;
    const maskLength = idCard.length - visibleStart - visibleEnd;
    return (
      idCard.substring(0, visibleStart) +
      '*'.repeat(Math.max(0, maskLength)) +
      idCard.substring(idCard.length - visibleEnd)
    );
  }

  /**
   * 脱敏银行卡号
   * 例如: 6222000012340000 -> 6222********0000
   */
  maskBankCard(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) {
      return cardNumber;
    }

    // 清理空格和非数字字符
    const cleaned = cardNumber.replace(/\D/g, '');

    // 显示前4位和后4位
    if (cleaned.length >= 8) {
      const visibleStart = 4;
      const visibleEnd = 4;
      const maskLength = cleaned.length - visibleStart - visibleEnd;
      return (
        cleaned.substring(0, visibleStart) +
        '*'.repeat(Math.max(0, maskLength)) +
        cleaned.substring(cleaned.length - visibleEnd)
      );
    }

    return cardNumber;
  }

  /**
   * 脱敏姓名
   * 例如: 张三 -> 张*, 张三丰 -> 张*丰
   */
  maskName(name: string): string {
    if (!name || name.length === 0) {
      return name;
    }

    if (name.length === 1) {
      return name;
    }

    if (name.length === 2) {
      return name[0] + '*';
    }

    // 3个字或更多，隐藏中间部分
    const firstChar = name[0];
    const lastChar = name[name.length - 1];
    const middleLength = name.length - 2;
    return (
      firstChar + '*'.repeat(middleLength > 3 ? 3 : middleLength) + lastChar
    );
  }

  /**
   * 脱敏地址
   * 例如: 北京市朝阳区某某街道123号 -> 北京市朝阳区******
   */
  maskAddress(address: string): string {
    if (!address || address.length < 6) {
      return address;
    }

    // 保留前面的省市区信息
    const visibleLength = Math.min(
      Math.floor(address.length * 0.4),
      address.length - 6,
    );
    return address.substring(0, visibleLength) + '******';
  }

  /**
   * 脱敏 IP 地址
   * 例如: 192.168.1.100 -> 192.168.*.*
   */
  maskIpAddress(ip: string): string {
    if (!ip) {
      return ip;
    }

    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
      }
    }

    // IPv6 - 隐藏后半部分
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + ':****:****:****:****';
      }
    }

    return ip;
  }

  /**
   * 脱敏密码
   * 始终返回固定的掩码
   */
  maskPassword(): string {
    return '********';
  }

  /**
   * 脱敏 Token
   * 例如: eyJhbGciOiJIUzI1NiIs... -> eyJ***
   */
  maskToken(token: string): string {
    if (!token || token.length < 10) {
      return '***';
    }

    return token.substring(0, 3) + '***';
  }

  /**
   * 脱敏 API Key
   * 例如: sk-1234567890abcdef -> sk-****def
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }

    const prefixMatch = apiKey.match(/^[a-zA-Z]{2,4}-/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const visibleEnd = 3;

    if (prefix) {
      return (
        prefix +
        '****' +
        (apiKey.length > prefix.length + visibleEnd
          ? apiKey.substring(apiKey.length - visibleEnd)
          : '')
      );
    }

    return (
      apiKey.substring(0, 4) +
      '****' +
      (apiKey.length > 7 ? apiKey.substring(apiKey.length - 3) : '')
    );
  }

  /**
   * 通用脱敏方法
   * 根据数据类型自动选择脱敏策略
   */
  maskSensitiveData(data: unknown, type?: string): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // 根据类型脱敏
    if (type) {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      switch (type.toLowerCase()) {
        case 'email':
          return this.maskEmail(value);
        case 'phone':
        case 'mobile':
          return this.maskPhoneNumber(value);
        case 'idcard':
        case 'id_card':
          return this.maskIdCard(value);
        case 'bankcard':
        case 'bank_card':
          return this.maskBankCard(value);
        case 'name':
          return this.maskName(value);
        case 'address':
          return this.maskAddress(value);
        case 'ip':
          return this.maskIpAddress(value);
        case 'password':
          return this.maskPassword();
        case 'token':
          return this.maskToken(value);
        case 'apikey':
        case 'api_key':
          return this.maskApiKey(value);
        default:
          return data;
      }
    }

    // 自动检测并脱敏
    if (typeof data === 'string') {
      // 检测邮箱
      if (data.includes('@') && data.includes('.')) {
        return this.maskEmail(data);
      }

      // 检测手机号 (简单匹配11位数字)
      if (/^1[3-9]\d{9}$/.test(data)) {
        return this.maskPhoneNumber(data);
      }

      // 检测身份证号
      if (/^\d{15}$|^\d{17}[\dXx]$/.test(data)) {
        return this.maskIdCard(data);
      }

      // 检测银行卡号 (13-19位数字)
      if (/^\d{13,19}$/.test(data)) {
        return this.maskBankCard(data);
      }

      // 检测 JWT token
      if (data.startsWith('eyJ')) {
        return this.maskToken(data);
      }

      // 检测 API key
      if (/^[a-zA-Z]{2,4}-[a-zA-Z0-9]{10,}/.test(data)) {
        return this.maskApiKey(data);
      }
    }

    return data;
  }

  /**
   * 深度脱敏对象
   * 递归脱敏对象中的敏感字段
   */
  maskObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsConfig?: Record<string, string>,
  ): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result: Record<string, unknown> = { ...obj };
    const sensitiveFields = fieldsConfig || {
      email: 'email',
      phone: 'phone',
      mobile: 'phone',
      idCard: 'idcard',
      id_card: 'idcard',
      bankCard: 'bankcard',
      bank_card: 'bankcard',
      password: 'password',
      token: 'token',
      apiKey: 'apikey',
      api_key: 'apikey',
      name: 'name',
      address: 'address',
      ip: 'ip',
      ipAddress: 'ip',
      ip_address: 'ip',
    };

    for (const [key, value] of Object.entries(result)) {
      // 检查是否是敏感字段
      const lowerKey = key.toLowerCase();
      const maskType = sensitiveFields[lowerKey] || sensitiveFields[key];

      if (maskType && value !== null && value !== undefined) {
        result[key] = this.maskSensitiveData(value, maskType);
      } else if (value && typeof value === 'object') {
        // 递归处理嵌套对象
        if (Array.isArray(value)) {
          result[key] = value.map((item): unknown =>
            typeof item === 'object' && item !== null
              ? this.maskObject(item as Record<string, unknown>, fieldsConfig)
              : item,
          ) as unknown;
        } else {
          result[key] = this.maskObject(
            value as Record<string, unknown>,
            fieldsConfig,
          );
        }
      }
    }

    return result;
  }
}
