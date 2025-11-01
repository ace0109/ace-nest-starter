import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { createPaginatedResponse } from '../../common/interceptors/response-transform.interceptor';
import { Prisma } from '@prisma/client';

/**
 * 用户控制器
 */
@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建用户
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户', description: '创建新用户账号' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  /**
   * 获取用户列表（分页）
   */
  @Get()
  @ApiOperation({ summary: '获取用户列表', description: '分页获取用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    description: '是否包含已删除用户',
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // 构建查询条件
    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (status) {
      where.status = status as Prisma.UserWhereInput['status'];
    }

    const { users, total } = await this.usersService.findAll({
      skip,
      take,
      where,
    });

    return createPaginatedResponse(
      users,
      total,
      Number(page),
      Number(pageSize),
    );
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据ID获取用户详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  /**
   * 更新用户
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息', description: '更新指定用户的信息' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  /**
   * 修改密码
   */
  @Patch(':id/password')
  @ApiOperation({ summary: '修改用户密码', description: '修改指定用户的密码' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '原密码错误或新密码不符合要求' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  /**
   * 删除用户（软删除）
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除用户', description: '软删除指定用户' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  /**
   * 恢复已删除的用户
   */
  @Post(':id/restore')
  @ApiOperation({ summary: '恢复用户', description: '恢复已软删除的用户' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.restore(id);
    return {
      message: 'User restored successfully',
      data: user,
    };
  }
}
