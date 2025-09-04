import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ROLES,
  SYSTEM_MODULES,
  ActionType
} from '../src/types/roles-permissions';

const prisma = new PrismaClient();

async function seedDefaultRoles() {
  console.log('🌱 بدء إنشاء الأدوار الافتراضية...');

  try {
    // إنشاء مستخدم افتراضي للنظام إذا لم يكن موجوداً
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@erp.local' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@erp.local',
          name: 'System User',
          role: 'ADMIN',
          active: true
        }
      });
      console.log('✅ تم إنشاء مستخدم النظام');
    }

    // إنشاء جميع الصلاحيات المطلوبة
    console.log('📝 إنشاء الصلاحيات...');
    const actions: ActionType[] = ['view', 'create', 'edit', 'delete', 'duplicate', 'approve'];
    
    for (const module of SYSTEM_MODULES) {
      for (const action of actions) {
        await prisma.permission.upsert({
          where: {
            module_action: {
              module: module.name,
              action: action
            }
          },
          update: {
            description: `${action} permission for ${module.displayName}`,
            active: true
          },
          create: {
            name: `${module.name}_${action}`,
            description: `${action} permission for ${module.displayName}`,
            module: module.name,
            action: action,
            active: true
          }
        });
      }
    }
    console.log('✅ تم إنشاء جميع الصلاحيات');

    // إنشاء الأدوار الافتراضية
    console.log('👥 إنشاء الأدوار الافتراضية...');
    
    for (const defaultRole of DEFAULT_ROLES) {
      // التحقق من وجود الدور
      const existingRole = await prisma.role.findUnique({
        where: { name: defaultRole.name }
      });

      let role;
      if (existingRole) {
        console.log(`⚠️  الدور "${defaultRole.name}" موجود بالفعل، سيتم تحديثه`);
        
        // حذف الصلاحيات الحالية
        await prisma.rolePermission.deleteMany({
          where: { roleId: existingRole.id }
        });
        
        // تحديث الدور
        role = await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            description: defaultRole.description,
            active: defaultRole.active
          }
        });
      } else {
        // إنشاء دور جديد
        role = await prisma.role.create({
          data: {
            name: defaultRole.name,
            description: defaultRole.description,
            active: defaultRole.active,
            createdById: systemUser.id
          }
        });
        console.log(`✅ تم إنشاء الدور "${defaultRole.name}"`);
      }

      // إضافة الصلاحيات للدور
      const rolePermissions: { roleId: string; permissionId: string; }[] = [];
      
      for (const permission of defaultRole.permissions) {
        for (const [action, enabled] of Object.entries(permission.actions)) {
          if (enabled) {
            const permissionRecord = await prisma.permission.findUnique({
              where: {
                module_action: {
                  module: permission.module,
                  action: action
                }
              }
            });

            if (permissionRecord) {
              rolePermissions.push({
                roleId: role.id,
                permissionId: permissionRecord.id
              });
            }
          }
        }
      }

      // إنشاء ربط الصلاحيات بالدور
      for (const rolePermission of rolePermissions) {
        try {
          await prisma.rolePermission.create({
            data: rolePermission
          });
        } catch (error) {
          // تجاهل الأخطاء المتعلقة بالتكرار
          if (error instanceof Error && !error.message.includes('Unique constraint')) {
            throw error;
          }
        }
      }

      console.log(`✅ تم ربط ${rolePermissions.length} صلاحية بالدور "${defaultRole.name}"`);
    }

    console.log('🎉 تم إنشاء جميع الأدوار الافتراضية بنجاح!');
    
    // عرض ملخص
    const rolesCount = await prisma.role.count();
    const permissionsCount = await prisma.permission.count();
    const rolePermissionsCount = await prisma.rolePermission.count();
    
    console.log('\n📊 ملخص النتائج:');
    console.log(`   - إجمالي الأدوار: ${rolesCount}`);
    console.log(`   - إجمالي الصلاحيات: ${permissionsCount}`);
    console.log(`   - إجمالي ربط الأدوار بالصلاحيات: ${rolePermissionsCount}`);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الأدوار الافتراضية:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  seedDefaultRoles()
    .then(() => {
      console.log('✅ تم الانتهاء من إنشاء الأدوار الافتراضية');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في إنشاء الأدوار الافتراضية:', error);
      process.exit(1);
    });
}

export default seedDefaultRoles;