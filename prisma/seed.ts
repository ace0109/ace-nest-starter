import { PrismaClient, UserStatus, RoleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed 数据库
 * 初始化系统必需的角色、权限和管理员账号
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ==================== 1. 创建角色 ====================
  console.log('📝 Creating roles...');

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'admin',
      description: '系统超级管理员,拥有所有权限',
      isSystem: true,
      status: RoleStatus.ACTIVE,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      name: '普通用户',
      code: 'user',
      description: '系统普通用户',
      isSystem: true,
      status: RoleStatus.ACTIVE,
    },
  });

  const guestRole = await prisma.role.upsert({
    where: { code: 'guest' },
    update: {},
    create: {
      name: '访客',
      code: 'guest',
      description: '系统访客,只读权限',
      isSystem: true,
      status: RoleStatus.ACTIVE,
    },
  });

  console.log(`✅ Created roles: Admin, User, Guest\n`);

  // ==================== 2. 创建权限 ====================
  console.log('📝 Creating permissions...');

  const permissions = [
    // 用户管理权限
    {
      name: '创建用户',
      code: 'user:create',
      description: '创建新用户',
      module: 'user',
    },
    {
      name: '查看用户',
      code: 'user:read',
      description: '查看用户信息',
      module: 'user',
    },
    {
      name: '更新用户',
      code: 'user:update',
      description: '更新用户信息',
      module: 'user',
    },
    {
      name: '删除用户',
      code: 'user:delete',
      description: '删除用户',
      module: 'user',
    },
    // 角色管理权限
    {
      name: '创建角色',
      code: 'role:create',
      description: '创建新角色',
      module: 'role',
    },
    {
      name: '查看角色',
      code: 'role:read',
      description: '查看角色信息',
      module: 'role',
    },
    {
      name: '更新角色',
      code: 'role:update',
      description: '更新角色信息',
      module: 'role',
    },
    {
      name: '删除角色',
      code: 'role:delete',
      description: '删除角色',
      module: 'role',
    },
    // 权限管理权限
    {
      name: '创建权限',
      code: 'permission:create',
      description: '创建新权限',
      module: 'permission',
    },
    {
      name: '查看权限',
      code: 'permission:read',
      description: '查看权限信息',
      module: 'permission',
    },
    {
      name: '更新权限',
      code: 'permission:update',
      description: '更新权限信息',
      module: 'permission',
    },
    {
      name: '删除权限',
      code: 'permission:delete',
      description: '删除权限',
      module: 'permission',
    },
    // 特殊权限
    {
      name: '所有权限',
      code: '*:*',
      description: '管理员拥有所有权限',
      module: 'system',
    },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { code: permission.code },
        update: {},
        create: permission,
      }),
    ),
  );

  console.log(`✅ Created ${createdPermissions.length} permissions\n`);

  // ==================== 3. 分配权限给角色 ====================
  console.log('📝 Assigning permissions to roles...');

  // 管理员拥有所有权限
  const allPermissions = await prisma.permission.findMany();
  await Promise.all(
    allPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  // 普通用户权限 (只读)
  const userPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: ['user:read', 'role:read', 'permission:read'],
      },
    },
  });

  await Promise.all(
    userPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  // 访客权限 (只读)
  const guestPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: ['user:read'],
      },
    },
  });

  await Promise.all(
    guestPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: guestRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: guestRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  console.log(`✅ Assigned permissions to roles\n`);

  // ==================== 4. 创建管理员账号 ====================
  console.log('📝 Creating admin user...');

  const hashedPassword = await bcrypt.hash('admin123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      nickname: '系统管理员',
      status: UserStatus.ACTIVE,
    },
  });

  // 分配管理员角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(
    `✅ Created admin user (email: admin@example.com, password: admin123456)\n`,
  );

  // ==================== 5. 创建测试用户 ====================
  console.log('📝 Creating test user...');

  const testUserPassword = await bcrypt.hash('user123456', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'testuser',
      password: testUserPassword,
      nickname: '测试用户',
      status: UserStatus.ACTIVE,
    },
  });

  // 分配普通用户角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: testUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      roleId: userRole.id,
    },
  });

  console.log(
    `✅ Created test user (email: user@example.com, password: user123456)\n`,
  );

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
