import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService as NestI18nService } from 'nestjs-i18n';

/**
 * 国际化服务
 * 提供翻译和多语言支持
 */
@Injectable()
export class I18nService {
  constructor(private readonly i18n: NestI18nService) {}

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): string {
    const i18nContext = I18nContext.current();
    return i18nContext?.lang || 'en-US';
  }

  /**
   * 翻译文本
   */
  translate(key: string, args?: Record<string, any>): string {
    const i18nContext = I18nContext.current();
    if (!i18nContext) {
      return this.i18n.translate(key, { args, lang: 'en-US' });
    }
    return i18nContext.t(key, args);
  }

  /**
   * 异步翻译文本
   */
  async translateAsync(
    key: string,
    args?: Record<string, any>,
    lang?: string,
  ): Promise<string> {
    return this.i18n.translate(key, {
      args,
      lang: lang || this.getCurrentLanguage(),
    });
  }

  /**
   * 验证消息国际化
   */
  translateValidation(
    key: string,
    field: string,
    constraints?: Record<string, any>,
  ): string {
    return this.translate(`validation.${key}`, { field, ...constraints });
  }

  /**
   * 错误消息国际化
   */
  translateError(errorCode: string | number, defaultMessage?: string): string {
    const key = `error.${errorCode}`;
    const translated = this.translate(key);

    // 如果没有找到翻译，返回默认消息
    if (translated === key) {
      return defaultMessage || `Error: ${errorCode}`;
    }

    return translated;
  }

  /**
   * 格式化时间相关的国际化文本
   */
  translateTime(key: string, count: number): string {
    // 处理复数形式
    const pluralKey = count > 1 ? `${key}_plural` : key;
    return this.translate(`time.${pluralKey}`, { count });
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): string[] {
    return ['en-US', 'zh-CN', 'zh-TW'];
  }

  /**
   * 检查是否支持某个语言
   */
  isLanguageSupported(lang: string): boolean {
    return this.getSupportedLanguages().includes(lang);
  }

  /**
   * 格式化分页信息
   */
  translatePagination(from: number, to: number, total: number): string {
    return this.translate('pagination.showing', { from, to, total });
  }

  /**
   * 批量翻译
   */
  async translateBatch(
    keys: string[],
    lang?: string,
  ): Promise<Record<string, string>> {
    const translations: Record<string, string> = {};

    for (const key of keys) {
      translations[key] = await this.translateAsync(key, undefined, lang);
    }

    return translations;
  }

  /**
   * 根据用户偏好获取翻译
   */
  async translateForUser(
    key: string,
    userLang?: string,
    args?: Record<string, any>,
  ): Promise<string> {
    const lang = userLang || this.getCurrentLanguage();
    return this.translateAsync(key, args, lang);
  }

  /**
   * 获取命名空间下的所有翻译
   */
  async getNamespaceTranslations(
    namespace: string,
    lang?: string,
  ): Promise<Record<string, any>> {
    const currentLang = lang || this.getCurrentLanguage();
    const translations: Record<string, any> = {};

    // 这里可以根据实际需要获取特定命名空间的所有翻译
    // 例如获取所有 'user.' 开头的翻译
    const namespaceKeys = [
      'profile',
      'settings',
      'account',
      'username',
      'email',
      'password',
      'firstName',
      'lastName',
      'fullName',
      'phone',
      'avatar',
      'bio',
      'role',
      'status',
      'active',
      'inactive',
    ];

    for (const key of namespaceKeys) {
      const fullKey = `${namespace}.${key}`;
      translations[key] = await this.translateAsync(
        fullKey,
        undefined,
        currentLang,
      );
    }

    return translations;
  }

  /**
   * 格式化货币（可扩展）
   */
  formatCurrency(amount: number, currency = 'USD'): string {
    const locale = this.getCurrentLanguage();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * 格式化日期（可扩展）
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = this.getCurrentLanguage();
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * 格式化数字
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.getCurrentLanguage();
    return new Intl.NumberFormat(locale, options).format(num);
  }

  /**
   * 获取相对时间描述
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return diffSeconds === 0
        ? this.translate('time.just_now')
        : this.translateTime('seconds_ago', diffSeconds);
    } else if (diffMinutes < 60) {
      return this.translateTime('minutes_ago', diffMinutes);
    } else if (diffHours < 24) {
      return this.translateTime('hours_ago', diffHours);
    } else if (diffDays < 7) {
      return this.translateTime('days_ago', diffDays);
    } else if (diffWeeks < 4) {
      return this.translateTime('weeks_ago', diffWeeks);
    } else if (diffMonths < 12) {
      return this.translateTime('months_ago', diffMonths);
    } else {
      return this.translateTime('years_ago', diffYears);
    }
  }
}
