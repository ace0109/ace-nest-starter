import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { I18nContext } from 'nestjs-i18n';

/**
 * 国际化验证管道
 * 将验证错误消息转换为对应语言
 */
@Injectable()
export class I18nValidationPipe implements PipeTransform<any> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(
      metatype,
      value as Record<string, unknown>,
    ) as object;
    const errors = await validate(object);

    if (errors.length > 0) {
      const i18n = I18nContext.current();
      const formattedErrors = this.formatErrors(errors, i18n);

      throw new BadRequestException({
        message: i18n?.t('validation.failed') || 'Validation failed',
        errors: formattedErrors,
      });
    }

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(
    errors: ValidationError[],
    i18n: I18nContext | undefined,
  ) {
    const formattedErrors: Record<string, string[]> = {};

    for (const error of errors) {
      const property = error.property;
      const messages: string[] = [];

      // 处理每个约束
      if (error.constraints) {
        for (const [constraint, defaultMessage] of Object.entries(
          error.constraints,
        )) {
          const translatedMessage = this.translateConstraint(
            constraint,
            property,
            error,
            i18n,
            defaultMessage,
          );
          messages.push(translatedMessage);
        }
      }

      // 处理嵌套验证错误
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children, i18n);
        for (const [childProp, childMessages] of Object.entries(childErrors)) {
          const nestedProperty = `${property}.${childProp}`;
          formattedErrors[nestedProperty] = childMessages;
        }
      }

      if (messages.length > 0) {
        formattedErrors[property] = messages;
      }
    }

    return formattedErrors;
  }

  private translateConstraint(
    constraint: string,
    property: string,
    error: ValidationError,
    i18n: I18nContext | undefined,
    defaultMessage: string,
  ): string {
    if (!i18n) {
      return defaultMessage;
    }

    // 映射 class-validator 约束到 i18n key
    const constraintMap: Record<string, string> = {
      isNotEmpty: 'required',
      isEmpty: 'mustBeEmpty',
      isEmail: 'email',
      isUrl: 'url',
      isInt: 'integer',
      isNumber: 'number',
      isPositive: 'positive',
      isNegative: 'negative',
      isBoolean: 'boolean',
      isString: 'string',
      isArray: 'array',
      isObject: 'object',
      isDate: 'date',
      isDateString: 'date',
      minLength: 'minLength',
      maxLength: 'maxLength',
      min: 'min',
      max: 'max',
      matches: 'pattern',
      isUUID: 'uuid',
      isJWT: 'jwt',
      isStrongPassword: 'strongPassword',
      isPhoneNumber: 'phone',
      isMobilePhone: 'phone',
      isAlpha: 'alpha',
      isAlphanumeric: 'alphanumeric',
      isEnum: 'enum',
      arrayMinSize: 'arrayMinSize',
      arrayMaxSize: 'arrayMaxSize',
      arrayUnique: 'arrayUnique',
      isIn: 'enum',
      isNotIn: 'notIn',
      isCreditCard: 'creditCard',
      isCurrency: 'currency',
      isHexColor: 'hexColor',
      isJSON: 'json',
      isLowercase: 'lowercase',
      isUppercase: 'uppercase',
      isMACAddress: 'macAddress',
      isPort: 'port',
      isSemVer: 'semver',
    };

    const i18nKey = constraintMap[constraint];
    if (!i18nKey) {
      return defaultMessage;
    }

    // 准备翻译参数
    const args = this.getConstraintArgs(constraint, error);
    const fieldName = i18n.t(`fields.${property}`, {
      defaultValue: property,
    });

    try {
      const translation = i18n.t(`validation.${i18nKey}`, {
        args: {
          field: fieldName,
          ...args,
        },
      });
      return translation;
    } catch {
      return defaultMessage;
    }
  }

  private getConstraintArgs(
    constraint: string,
    error: ValidationError,
  ): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    switch (constraint) {
      case 'minLength':
      case 'arrayMinSize':
        if (error.constraints && error.constraints[constraint]) {
          args.min = error.constraints[constraint].match(/\d+/)?.[0];
        }
        break;

      case 'maxLength':
      case 'arrayMaxSize':
        if (error.constraints && error.constraints[constraint]) {
          args.max = error.constraints[constraint].match(/\d+/)?.[0];
        }
        break;

      case 'min':
        if (
          error.value !== undefined &&
          error.constraints &&
          error.constraints[constraint]
        ) {
          args.min = error.constraints[constraint].match(/\d+/)?.[0];
        }
        break;

      case 'max':
        if (
          error.value !== undefined &&
          error.constraints &&
          error.constraints[constraint]
        ) {
          args.max = error.constraints[constraint].match(/\d+/)?.[0];
        }
        break;

      case 'isEnum':
      case 'isIn':
        // For enum validation, we need to extract the allowed values
        // This is a simplified approach since ValidationError doesn't expose contexts
        break;

      case 'matches':
        // For matches validation, we'd need access to the pattern
        // This is also simplified
        break;
    }

    return args;
  }
}

/**
 * 创建国际化验证管道工厂函数
 */
export function createI18nValidationPipe(): I18nValidationPipe {
  return new I18nValidationPipe();
}
