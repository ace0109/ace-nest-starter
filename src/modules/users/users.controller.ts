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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { createPaginatedResponse } from '../../common/interceptors/response-transform.interceptor';
import { Prisma } from '@prisma/client';

/**
 * 用户控制器
 */
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建用户
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  /**
   * 恢复已删除的用户
   */
  @Post(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.restore(id);
    return {
      message: 'User restored successfully',
      data: user,
    };
  }
}
