import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'مدير النظام',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  // Create demo manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'مدير المشتريات',
      password: hashedPassword,
      role: 'MANAGER',
      active: true,
    },
  });

  // Create demo regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'موظف التصنيع',
      password: hashedPassword,
      role: 'USER',
      active: true,
    },
  });

  // Create basic permissions
  const permissions = [
    // Dashboard permissions
    { name: 'dashboard.read', description: 'عرض لوحة التحكم', module: 'dashboard', action: 'read' },
    
    // Users module permissions
    { name: 'users.create', description: 'إنشاء مستخدم جديد', module: 'users', action: 'create' },
    { name: 'users.read', description: 'عرض المستخدمين', module: 'users', action: 'read' },
    { name: 'users.update', description: 'تعديل المستخدمين', module: 'users', action: 'update' },
    { name: 'users.delete', description: 'حذف المستخدمين', module: 'users', action: 'delete' },
    { name: 'users.export', description: 'تصدير بيانات المستخدمين', module: 'users', action: 'export' },
    
    // Roles module permissions
    { name: 'roles.create', description: 'إنشاء دور جديد', module: 'roles', action: 'create' },
    { name: 'roles.read', description: 'عرض الأدوار', module: 'roles', action: 'read' },
    { name: 'roles.update', description: 'تعديل الأدوار', module: 'roles', action: 'update' },
    { name: 'roles.delete', description: 'حذف الأدوار', module: 'roles', action: 'delete' },
    
    // Purchasing module permissions
    { name: 'purchasing.create', description: 'إنشاء طلب شراء', module: 'purchasing', action: 'create' },
    { name: 'purchasing.read', description: 'عرض المشتريات', module: 'purchasing', action: 'read' },
    { name: 'purchasing.update', description: 'تعديل المشتريات', module: 'purchasing', action: 'update' },
    { name: 'purchasing.delete', description: 'حذف المشتريات', module: 'purchasing', action: 'delete' },
    { name: 'purchasing.approve', description: 'اعتماد المشتريات', module: 'purchasing', action: 'approve' },
    
    // Manufacturing module permissions
    { name: 'manufacturing.create', description: 'إنشاء أمر تصنيع', module: 'manufacturing', action: 'create' },
    { name: 'manufacturing.read', description: 'عرض التصنيع', module: 'manufacturing', action: 'read' },
    { name: 'manufacturing.update', description: 'تعديل التصنيع', module: 'manufacturing', action: 'update' },
    { name: 'manufacturing.delete', description: 'حذف التصنيع', module: 'manufacturing', action: 'delete' },
    { name: 'manufacturing.approve', description: 'اعتماد التصنيع', module: 'manufacturing', action: 'approve' },
    
    // Packaging module permissions
    { name: 'packaging.create', description: 'إنشاء أمر تعبئة', module: 'packaging', action: 'create' },
    { name: 'packaging.read', description: 'عرض التعبئة', module: 'packaging', action: 'read' },
    { name: 'packaging.update', description: 'تعديل التعبئة', module: 'packaging', action: 'update' },
    { name: 'packaging.delete', description: 'حذف التعبئة', module: 'packaging', action: 'delete' },
    { name: 'packaging.approve', description: 'اعتماد التعبئة', module: 'packaging', action: 'approve' },
    
    // Warehouses module permissions
    { name: 'warehouses.create', description: 'إنشاء مستودع', module: 'warehouses', action: 'create' },
    { name: 'warehouses.read', description: 'عرض المستودعات', module: 'warehouses', action: 'read' },
    { name: 'warehouses.update', description: 'تعديل المستودعات', module: 'warehouses', action: 'update' },
    { name: 'warehouses.delete', description: 'حذف المستودعات', module: 'warehouses', action: 'delete' },
    
    // Sales module permissions
    { name: 'sales.create', description: 'إنشاء طلب بيع', module: 'sales', action: 'create' },
    { name: 'sales.read', description: 'عرض المبيعات', module: 'sales', action: 'read' },
    { name: 'sales.update', description: 'تعديل المبيعات', module: 'sales', action: 'update' },
    { name: 'sales.delete', description: 'حذف المبيعات', module: 'sales', action: 'delete' },
    { name: 'sales.approve', description: 'اعتماد المبيعات', module: 'sales', action: 'approve' },
    
    // Reports module permissions
    { name: 'reports.read', description: 'عرض التقارير', module: 'reports', action: 'read' },
    { name: 'reports.export', description: 'تصدير التقارير', module: 'reports', action: 'export' },
    { name: 'reports.print', description: 'طباعة التقارير', module: 'reports', action: 'print' },
    
    // Settings module permissions
    { name: 'settings.read', description: 'عرض الإعدادات', module: 'settings', action: 'read' },
    { name: 'settings.update', description: 'تعديل الإعدادات', module: 'settings', action: 'update' },
    
    // System permissions
    { name: 'system.admin', description: 'صلاحيات إدارة النظام', module: 'system', action: 'admin' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { 
        module_action: {
          module: permission.module,
          action: permission.action
        }
      },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission,
    });
  }

  // Create basic roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'مدير النظام' },
    update: {},
    create: {
      name: 'مدير النظام',
      description: 'صلاحيات كاملة لإدارة النظام',
      active: true,
      createdById: adminUser.id,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'مدير' },
    update: {},
    create: {
      name: 'مدير',
      description: 'صلاحيات إدارية محدودة',
      active: true,
      createdById: adminUser.id,
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'مشرف عام' },
    update: {},
    create: {
      name: 'مشرف عام',
      description: 'صلاحيات إشرافية محدودة - عرض فقط في قسم المستخدمين',
      active: true,
      createdById: adminUser.id,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'مستخدم' },
    update: {},
    create: {
      name: 'مستخدم',
      description: 'صلاحيات أساسية للمستخدم',
      active: true,
      createdById: adminUser.id,
    },
  });

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
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
    });
  }

  // Assign limited permissions to manager role
  const managerPermissions = allPermissions.filter(p => 
    p.module === 'users' || p.module === 'dashboard' || 
    (p.module === 'roles' && p.action === 'read')
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign very limited permissions to supervisor role (view only in users module)
  const supervisorPermissions = allPermissions.filter(p => 
    p.module === 'dashboard' || 
    (p.module === 'users' && p.action === 'read')
  );
  for (const permission of supervisorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supervisorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: supervisorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign basic permissions to user role
  const userPermissions = allPermissions.filter(p => 
    p.module === 'dashboard' && p.action === 'read'
  );
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
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
    });
  }

  // Assign roles to users
  await prisma.userRoleAssignment.upsert({
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
      active: true,
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: supervisorRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: supervisorRole.id,
      active: true,
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
      active: true,
    },
  });

  // Create some sample posts
  const post1 = await prisma.post.create({
    data: {
      title: 'مرحباً بك في نظام إدارة المصنع',
      content: 'هذا هو أول منشور في النظام الجديد لإدارة المصنع. النظام يدعم جميع عمليات المصنع من المشتريات إلى المبيعات.',
      published: true,
      authorId: adminUser.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'إرشادات استخدام النظام',
      content: 'يرجى الالتزام بالتعليمات التالية عند استخدام النظام: 1. تسجيل الدخول باستخدام بيانات الاعتماد المخصصة 2. عدم مشاركة كلمة المرور مع الآخرين 3. تسجيل الخروج بعد الانتهاء من العمل.',
      published: true,
      authorId: adminUser.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Demo users created:');
  console.log('Admin: admin@example.com / password123');
  console.log('Manager: manager@example.com / password123');
  console.log('User: user@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });