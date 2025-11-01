import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard) // 所有权限接口需要认证
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 创建权限
   */
  @Post()
  @ApiOperation({ summary: '创建权限', description: '创建新的系统权限' })
  @ApiResponse({ status: 201, description: '权限创建成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '权限代码已存在' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.permissionsService.create(createPermissionDto);
    return {
      message: '权限创建成功',
      data: permission,
    };
  }

  /**
   * 获取权限列表
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('module') module?: string,
  ) {
    const result = await this.permissionsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      name,
      code,
      module,
    });
    return {
      message: '权限列表获取成功',
      data: result.permissions,
      total: result.total,
    };
  }

  /**
   * 按模块分组获取权限
   */
  @Get('grouped')
  async findGrouped() {
    const grouped = await this.permissionsService.findGroupedByModule();
    return {
      message: '权限列表获取成功',
      data: grouped,
    };
  }

  /**
   * 获取权限详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const permission = await this.permissionsService.findOne(id);
    return {
      message: '权限详情获取成功',
      data: permission,
    };
  }

  /**
   * 更新权限
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.update(
      id,
      updatePermissionDto,
    );
    return {
      message: '权限更新成功',
      data: permission,
    };
  }

  /**
   * 删除权限
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  /**
   * 批量创建权限
   */
  @Post('batch')
  async createMany(@Body() body: { permissions: CreatePermissionDto[] }) {
    const result = await this.permissionsService.createMany(body.permissions);
    return {
      message: `成功创建 ${result.count} 个权限`,
      data: result,
    };
  }
}
