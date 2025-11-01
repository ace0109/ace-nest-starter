import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { BusinessException } from './common/exceptions/business.exception';
import { createSuccessResponse } from './common/interceptors/response-transform.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ===== 测试错误处理的端点 =====

  @Get('test/success')
  testSuccess() {
    return { message: 'This is a successful response', timestamp: new Date() };
  }

  @Get('test/custom-success')
  testCustomSuccess() {
    return createSuccessResponse(
      { id: 1, name: 'Test User' },
      'User retrieved successfully',
      200,
    );
  }

  @Get('test/business-error')
  testBusinessError() {
    throw BusinessException.notFound('User', '123');
  }

  @Get('test/validation-error')
  testValidationError() {
    throw BusinessException.validation('Invalid input data', [
      'Email format is invalid',
      'Password must be at least 8 characters',
    ]);
  }

  @Get('test/unauthorized')
  testUnauthorized() {
    throw BusinessException.unauthorized('Invalid token provided');
  }

  @Get('test/forbidden')
  testForbidden() {
    throw BusinessException.forbidden(
      'You do not have permission to access this resource',
    );
  }

  @Get('test/duplicate')
  testDuplicate() {
    throw BusinessException.duplicate('User', 'email');
  }

  @Get('test/nest-error/:id')
  testNestError(@Param('id', ParseIntPipe) id: number) {
    // 这会触发 NestJS 的验证管道错误（如果传入非数字）
    return { id };
  }

  @Get('test/system-error')
  testSystemError() {
    // 触发一个普通的 JavaScript 错误
    throw new Error('Unexpected system error occurred');
  }

  @Get('test/unhandled-error')
  testUnhandledError() {
    // 触发一个未处理的类型错误
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const obj = null as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return obj.someProperty; // 这会触发 TypeError
  }
}
