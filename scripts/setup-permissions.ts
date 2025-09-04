import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPermissionsAndRoles() {
  try {
    console.log('🔐 إنشاء الصلاحيات الأساسية...');
    
    // إنشاء الصلاحيات الأساسية
    const permissions = [
      // صلاحيات المستخدمين
      { name: 'users.create', description: 'إنشاء مستخدمين جدد', module: 'users', action: 'create' },
      { name: 'users.read', description: 'عرض المستخدمين', module: 'users', action: 'read' },
      { name: 'users.update', description: 'تعديل المستخدمين', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'حذف المستخدمين', module: 'users', action: 'delete' },
      
      // صلاحيات الأدوار
      { name: 'roles.create', description: 'إنشاء أدوار جديدة', module: 'roles', action: 'create' },
      { name: 'roles.read', description: 'عرض الأدوار', module: 'roles', action: 'read' },
      { name: 'roles.update', description: 'تعديل الأدوار', module: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'حذف الأدوار', module: 'roles', action: 'delete' },
      
      // صلاحيات لوحة التحكم
      { name: 'dashboard.read', description: 'عرض لوحة التحكم', module: 'dashboard', action: 'read' },
      
      // صلاحيات الملف الشخصي
      { name: 'profile.read', description: 'عرض الملف الشخصي', module: 'profile', action: 'read' },
      { name: 'profile.update', description: 'تعديل الملف الشخصي', module: 'profile', action: 'update' },
      
      // صلاحيات التقارير
      { name: 'reports.read', description: 'عرض التقارير', module: 'reports', action: 'read' },
      { name: 'reports.export', description: 'تصدير التقارير', module: 'reports', action: 'export' },
      
      // صلاحيات الإعدادات
      { name: 'settings.read', description: 'عرض الإعدادات', module: 'settings', action: 'read' },
      { name: 'settings.update', description: 'تعديل الإعدادات', module: 'settings', action: 'update' },
    ];
    
    const createdPermissions: any[] = [];
    for (const permission of permissions) {
      const created = await prisma.permission.create({
        data: permission
      });
      createdPermissions.push(created);
      console.log(`✅ تم إنشاء صلاحية: ${permission.name}`);
    }
    
    console.log('\n👑 إنشاء دور مدير النظام...');
    
    // البحث عن مدير النظام
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@system.com' }
    });
    
    if (!adminUser) {
      throw new Error('لم يتم العثور على مدير النظام');
    }
    
    // إنشاء دور مدير النظام
    const adminRole = await prisma.role.create({
      data: {
        name: 'مدير النظام',
        description: 'دور مدير النظام مع كامل الصلاحيات',
        createdById: adminUser.id
      }
    });
    
    // إضافة جميع الصلاحيات لمدير النظام
    for (const permission of createdPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }
    
    // تعيين دور مدير النظام للمستخدم
    await prisma.userRoleAssignment.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    
    console.log('✅ تم إنشاء دور مدير النظام وتعيين جميع الصلاحيات');
    
    console.log('\n👤 إنشاء دور المستخدم المحدود...');
    
    // البحث عن المستخدم المحدود
    const limitedUser = await prisma.user.findUnique({
      where: { email: 'user@system.com' }
    });
    
    if (!limitedUser) {
      throw new Error('لم يتم العثور على المستخدم المحدود');
    }
    
    // إنشاء دور المستخدم المحدود
    const userRole = await prisma.role.create({
      data: {
        name: 'مستخدم محدود',
        description: 'دور مستخدم مع صلاحيات محدودة',
        createdById: adminUser.id
      }
    });
    
    // إضافة صلاحيات محدودة للمستخدم
    const limitedPermissions = createdPermissions.filter((p: any) => 
      p.name === 'dashboard.read' ||
      p.name === 'profile.read' ||
      p.name === 'profile.update' ||
      p.name === 'users.read' ||
      p.name === 'roles.read'
    );
    
    for (const permission of limitedPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId: permission.id
        }
      });
    }
    
    // تعيين دور المستخدم المحدود
    await prisma.userRoleAssignment.create({
      data: {
        userId: limitedUser.id,
        roleId: userRole.id
      }
    });
    
    console.log('✅ تم إنشاء دور المستخدم المحدود وتعيين الصلاحيات المحدودة');
    
    console.log('\n📋 ملخص الإعداد:');
    console.log(`تم إنشاء ${createdPermissions.length} صلاحية`);
    console.log('تم إنشاء دورين: مدير النظام ومستخدم محدود');
    console.log('تم تعيين الأدوار للمستخدمين المناسبين');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد الصلاحيات والأدوار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPermissionsAndRoles();