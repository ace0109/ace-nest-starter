import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { BusinessException } from './common/exceptions/business.exception';
import { createSuccessResponse } from './common/interceptors/response-transform.interceptor';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ===== 测试错误处理的端点 =====

  @Public()
  @Public()
  @Get('test/success')
  testSuccess() {
    return { message: 'This is a successful response', timestamp: new Date() };
  }

  @Public()
  @Get('test/custom-success')
  testCustomSuccess() {
    return createSuccessResponse(
      { id: 1, name: 'Test User' },
      'User retrieved successfully',
      200,
    );
  }

  @Public()
  @Get('test/business-error')
  testBusinessError() {
    throw BusinessException.notFound('User', '123');
  }

  @Public()
  @Get('test/validation-error')
  testValidationError() {
    throw BusinessException.validation('Invalid input data', [
      'Email format is invalid',
      'Password must be at least 8 characters',
    ]);
  }

  @Public()
  @Get('test/unauthorized')
  testUnauthorized() {
    throw BusinessException.unauthorized('Invalid token provided');
  }

  @Public()
  @Get('test/forbidden')
  testForbidden() {
    throw BusinessException.forbidden(
      'You do not have permission to access this resource',
    );
  }

  @Public()
  @Get('test/duplicate')
  testDuplicate() {
    throw BusinessException.duplicate('User', 'email');
  }

  @Public()
  @Get('test/nest-error/:id')
  testNestError(@Param('id', ParseIntPipe) id: number) {
    // 这会触发 NestJS 的验证管道错误（如果传入非数字）
    return { id };
  }

  @Public()
  @Get('test/system-error')
  testSystemError() {
    // 触发一个普通的 JavaScript 错误
    throw new Error('Unexpected system error occurred');
  }

  @Public()
  @Get('test/unhandled-error')
  testUnhandledError(): never {
    // 触发一个未处理的类型错误
    throw new TypeError('Cannot read properties of null');
  }
}
