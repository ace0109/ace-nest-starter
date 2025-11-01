import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray({ message: '权限ID列表必须是数组' })
  @IsUUID('4', { each: true, message: '每个权限ID必须是有效的UUID' })
  permissionIds: string[];
}
