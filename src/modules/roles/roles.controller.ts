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
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleStatus } from '@prisma/client';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard) // 所有角色接口需要认证
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * 创建角色
   */
  @Post()
  @ApiOperation({ summary: '创建角色', description: '创建新的系统角色' })
  @ApiResponse({ status: 201, description: '角色创建成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '角色代码已存在' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      message: '角色创建成功',
      data: role,
    };
  }

  /**
   * 获取角色列表
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('status') status?: RoleStatus,
  ) {
    const result = await this.rolesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      name,
      code,
      status,
    });
    return {
      message: '角色列表获取成功',
      data: result.roles,
      total: result.total,
    };
  }

  /**
   * 获取角色详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    return {
      message: '角色详情获取成功',
      data: role,
    };
  }

  /**
   * 更新角色
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      message: '角色更新成功',
      data: role,
    };
  }

  /**
   * 删除角色
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  /**
   * 分配权限给角色
   */
  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    const role = await this.rolesService.assignPermissions(
      id,
      assignPermissionsDto,
    );
    return {
      message: '权限分配成功',
      data: role,
    };
  }

  /**
   * 给用户分配角色
   */
  @Post('assign-to-user')
  async assignToUser(@Body() body: { userId: string; roleIds: string[] }) {
    return this.rolesService.assignToUser(body.userId, body.roleIds);
  }
}
