import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSupervisorPermissions() {
  try {
    console.log('🔧 إصلاح صلاحيات دور المشرف العام...');
    
    // البحث عن دور المشرف العام
    const supervisorRole = await prisma.role.findUnique({
      where: { name: 'مشرف عام' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!supervisorRole) {
      console.log('❌ لم يتم العثور على دور المشرف العام');
      return;
    }
    
    console.log(`📋 الدور الحالي: ${supervisorRole.name}`);
    console.log(`📝 الوصف: ${supervisorRole.description}`);
    console.log(`🔢 عدد الصلاحيات الحالية: ${supervisorRole.permissions.length}`);
    
    // حذف جميع الصلاحيات الحالية للمشرف العام
    await prisma.rolePermission.deleteMany({
      where: { roleId: supervisorRole.id }
    });
    
    console.log('🗑️ تم حذف الصلاحيات القديمة');
    
    // الحصول على جميع الصلاحيات المطلوبة للمشرف العام
    const requiredPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          // صلاحيات لوحة التحكم
          { module: 'dashboard' },
          // صلاحيات المستخدمين - جميع العمليات
          { module: 'users', action: 'read' },
          { module: 'users', action: 'create' },
          { module: 'users', action: 'update' },
          { module: 'users', action: 'delete' },
          // صلاحيات الأدوار - قراءة فقط
          { module: 'roles', action: 'read' },
          // صلاحيات الملف الشخصي
          { module: 'profile' },
          // صلاحيات التقارير
          { module: 'reports', action: 'read' }
        ]
      }
    });
    
    console.log(`📊 عدد الصلاحيات الجديدة: ${requiredPermissions.length}`);
    
    // إضافة الصلاحيات الجديدة
    for (const permission of requiredPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: supervisorRole.id,
          permissionId: permission.id
        }
      });
      console.log(`✅ تم إضافة صلاحية: ${permission.module}.${permission.action}`);
    }
    
    // تحديث وصف الدور
    await prisma.role.update({
      where: { id: supervisorRole.id },
      data: {
        description: 'صلاحيات إشرافية - إدارة كاملة للمستخدمين وعرض التقارير'
      }
    });
    
    console.log('🎉 تم إصلاح صلاحيات المشرف العام بنجاح!');
    
    // عرض ملخص الصلاحيات الجديدة
    const updatedRole = await prisma.role.findUnique({
      where: { id: supervisorRole.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log('\n📋 ملخص الصلاحيات الجديدة:');
    const permissionsByModule = updatedRole?.permissions.reduce((acc, rp) => {
      const module = rp.permission.module;
      if (!acc[module]) acc[module] = [];
      acc[module].push(rp.permission.action);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(permissionsByModule || {}).forEach(([module, actions]) => {
      console.log(`   ${module}: ${actions.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح صلاحيات المشرف العام:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSupervisorPermissions()
  .then(() => {
    console.log('✅ تم الانتهاء من إصلاح الصلاحيات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في إصلاح الصلاحيات:', error);
    process.exit(1);
  });