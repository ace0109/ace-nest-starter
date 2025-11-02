import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { I18nService } from './i18n.service';
import { I18nLang } from 'nestjs-i18n';
import { Public } from '../../common/decorators/auth.decorators';

// 测试 DTO
class TestValidationDto {
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  age: number;
}

enum Language {
  EN_US = 'en-US',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
}

/**
 * 国际化测试控制器
 */
@ApiTags('i18n-test')
@Controller('test/i18n')
@Public()
export class I18nTestController {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * 获取当前语言
   */
  @Get('current-language')
  @ApiOperation({ summary: '获取当前语言' })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: '语言偏好',
  })
  getCurrentLanguage(@I18nLang() lang: string) {
    return {
      currentLanguage: lang,
      supportedLanguages: this.i18nService.getSupportedLanguages(),
    };
  }

  /**
   * 测试基础翻译
   */
  @Get('translate')
  @ApiOperation({ summary: '测试基础翻译' })
  @ApiQuery({ name: 'key', required: true, description: '翻译键名' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: Language,
    description: '指定语言',
  })
  async testTranslation(
    @Query('key') key: string,
    @Query('lang') lang?: string,
    @I18nLang() currentLang?: string,
  ) {
    const targetLang = lang || currentLang || 'en-US';
    const translation = await this.i18nService.translateAsync(
      key,
      undefined,
      targetLang,
    );

    return {
      key,
      language: targetLang,
      translation,
    };
  }

  /**
   * 测试带参数的翻译
   */
  @Get('translate-with-args')
  @ApiOperation({ summary: '测试带参数的翻译' })
  @ApiQuery({ name: 'field', required: true, description: '字段名' })
  @ApiQuery({ name: 'min', required: true, description: '最小值' })
  async testTranslationWithArgs(
    @Query('field') field: string,
    @Query('min') min: string,
    @I18nLang() lang: string,
  ) {
    const key = 'validation.minLength';
    const translation = await this.i18nService.translateAsync(
      key,
      { field, min },
      lang,
    );

    return {
      key,
      args: { field, min },
      language: lang,
      translation,
    };
  }

  /**
   * 测试验证消息国际化
   */
  @Post('validation')
  @ApiOperation({ summary: '测试验证消息国际化' })
  @HttpCode(HttpStatus.OK)
  testValidation(@Body() dto: TestValidationDto) {
    // 这个端点实际上永远不会到达，因为验证会在之前失败
    // 但是失败的验证消息会被国际化
    return {
      message: 'Validation passed',
      data: dto,
    };
  }

  /**
   * 测试错误消息国际化
   */
  @Get('errors/:type')
  @ApiOperation({ summary: '测试错误消息国际化' })
  testErrors(@Param('type') type: string) {
    switch (type) {
      case 'unauthorized':
        throw new UnauthorizedException('auth.unauthorized');
      case 'not-found':
        throw new NotFoundException('user.userNotFound');
      case 'bad-request':
        throw new BadRequestException('validation.required');
      default:
        throw new BadRequestException('error.unknownError');
    }
  }

  /**
   * 测试时间格式化
   */
  @Get('relative-time')
  @ApiOperation({ summary: '测试相对时间格式化' })
  @ApiQuery({ name: 'seconds', required: false, description: '几秒前' })
  @ApiQuery({ name: 'minutes', required: false, description: '几分钟前' })
  @ApiQuery({ name: 'hours', required: false, description: '几小时前' })
  @ApiQuery({ name: 'days', required: false, description: '几天前' })
  testRelativeTime(
    @Query('seconds') seconds?: string,
    @Query('minutes') minutes?: string,
    @Query('hours') hours?: string,
    @Query('days') days?: string,
  ) {
    const now = new Date();
    const dates: Array<{ label: string; date: Date; relative: string }> = [];

    if (seconds) {
      const date = new Date(now.getTime() - parseInt(seconds) * 1000);
      dates.push({
        label: `${seconds} seconds ago`,
        date,
        relative: this.i18nService.getRelativeTime(date),
      });
    }

    if (minutes) {
      const date = new Date(now.getTime() - parseInt(minutes) * 60 * 1000);
      dates.push({
        label: `${minutes} minutes ago`,
        date,
        relative: this.i18nService.getRelativeTime(date),
      });
    }

    if (hours) {
      const date = new Date(now.getTime() - parseInt(hours) * 60 * 60 * 1000);
      dates.push({
        label: `${hours} hours ago`,
        date,
        relative: this.i18nService.getRelativeTime(date),
      });
    }

    if (days) {
      const date = new Date(
        now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000,
      );
      dates.push({
        label: `${days} days ago`,
        date,
        relative: this.i18nService.getRelativeTime(date),
      });
    }

    if (dates.length === 0) {
      dates.push({
        label: 'just now',
        date: now,
        relative: this.i18nService.getRelativeTime(now),
      });
    }

    return {
      currentLanguage: this.i18nService.getCurrentLanguage(),
      results: dates,
    };
  }

  /**
   * 测试数字格式化
   */
  @Get('format-number')
  @ApiOperation({ summary: '测试数字格式化' })
  @ApiQuery({ name: 'number', required: true, description: '数字' })
  @ApiQuery({ name: 'currency', required: false, description: '货币代码' })
  testNumberFormatting(
    @Query('number') number: string,
    @Query('currency') currency?: string,
  ) {
    const num = parseFloat(number);
    const lang = this.i18nService.getCurrentLanguage();

    return {
      language: lang,
      input: num,
      formatted: {
        number: this.i18nService.formatNumber(num),
        currency: currency
          ? this.i18nService.formatCurrency(num, currency)
          : null,
        percent: this.i18nService.formatNumber(num / 100, { style: 'percent' }),
        decimal: this.i18nService.formatNumber(num, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      },
    };
  }

  /**
   * 测试日期格式化
   */
  @Get('format-date')
  @ApiOperation({ summary: '测试日期格式化' })
  testDateFormatting() {
    const date = new Date();
    const lang = this.i18nService.getCurrentLanguage();

    return {
      language: lang,
      date: date.toISOString(),
      formatted: {
        short: this.i18nService.formatDate(date, {
          dateStyle: 'short',
        }),
        medium: this.i18nService.formatDate(date, {
          dateStyle: 'medium',
        }),
        long: this.i18nService.formatDate(date, {
          dateStyle: 'long',
        }),
        full: this.i18nService.formatDate(date, {
          dateStyle: 'full',
        }),
        time: this.i18nService.formatDate(date, {
          timeStyle: 'medium',
        }),
        datetime: this.i18nService.formatDate(date, {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      },
    };
  }

  /**
   * 获取命名空间翻译
   */
  @Get('namespace/:ns')
  @ApiOperation({ summary: '获取命名空间下的所有翻译' })
  async getNamespaceTranslations(
    @Param('ns') namespace: string,
    @Query('lang') lang?: string,
  ) {
    const translations = await this.i18nService.getNamespaceTranslations(
      namespace,
      lang,
    );

    return {
      namespace,
      language: lang || this.i18nService.getCurrentLanguage(),
      translations,
    };
  }

  /**
   * 批量翻译
   */
  @Post('batch-translate')
  @ApiOperation({ summary: '批量翻译多个键' })
  async batchTranslate(@Body() body: { keys: string[]; lang?: string }) {
    const translations = await this.i18nService.translateBatch(
      body.keys,
      body.lang,
    );

    return {
      language: body.lang || this.i18nService.getCurrentLanguage(),
      translations,
    };
  }

  /**
   * 测试分页信息翻译
   */
  @Get('pagination')
  @ApiOperation({ summary: '测试分页信息翻译' })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  @ApiQuery({ name: 'total', required: false, default: 100 })
  testPagination(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('total') total: string = '100',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalNum = parseInt(total);

    const from = (pageNum - 1) * limitNum + 1;
    const to = Math.min(pageNum * limitNum, totalNum);

    return {
      language: this.i18nService.getCurrentLanguage(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalNum,
        from,
        to,
        message: this.i18nService.translatePagination(from, to, totalNum),
      },
      translations: {
        previous: this.i18nService.translate('pagination.previous'),
        next: this.i18nService.translate('pagination.next'),
        first: this.i18nService.translate('pagination.first'),
        last: this.i18nService.translate('pagination.last'),
      },
    };
  }

  /**
   * 获取所有通用翻译
   */
  @Get('common-translations')
  @ApiOperation({ summary: '获取所有通用翻译' })
  async getCommonTranslations(@Query('lang') lang?: string) {
    const keys = [
      'common.success',
      'common.error',
      'common.warning',
      'common.confirm',
      'common.cancel',
      'common.save',
      'common.delete',
      'common.edit',
      'common.search',
      'common.loading',
      'common.noData',
    ];

    const translations = await this.i18nService.translateBatch(keys, lang);

    return {
      language: lang || this.i18nService.getCurrentLanguage(),
      translations,
    };
  }
}
