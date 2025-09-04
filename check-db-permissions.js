// فحص صلاحيات قاعدة البيانات
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabasePermissions() {
  try {
    console.log('🔍 فحص قاعدة البيانات...');
    
    // جلب جميع الأدوار مع صلاحياتها
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log('📊 عدد الأدوار الموجودة:', roles.length);
    
    roles.forEach(role => {
      console.log(`\n🎭 الدور: ${role.name} (ID: ${role.id})`);
      console.log(`📝 الوصف: ${role.description || 'غير محدد'}`);
      console.log(`✅ نشط: ${role.active}`);
      console.log(`🔐 عدد الصلاحيات: ${role.permissions.length}`);
      
      if (role.permissions.length > 0) {
        console.log('📋 الصلاحيات التفصيلية:');
        role.permissions.forEach(rp => {
          console.log(`  - ${rp.permission.module}.${rp.permission.action}`);
        });
      } else {
        console.log('⚠️  لا توجد صلاحيات مسجلة!');
      }
    });
    
    // فحص جدول الصلاحيات الأساسية
    const allPermissions = await prisma.permission.findMany();
    console.log(`\n🗂️  إجمالي الصلاحيات المتاحة في النظام: ${allPermissions.length}`);
    
    // تجميع الصلاحيات حسب الوحدة
    const permissionsByModule = {};
    allPermissions.forEach(perm => {
      if (!permissionsByModule[perm.module]) {
        permissionsByModule[perm.module] = [];
      }
      permissionsByModule[perm.module].push(perm.action);
    });
    
    console.log('\n📚 الصلاحيات حسب الوحدة:');
    Object.entries(permissionsByModule).forEach(([module, actions]) => {
      console.log(`  ${module}: ${actions.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الفحص
checkDatabasePermissions();