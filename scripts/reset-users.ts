import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('🗑️ حذف جميع البيانات الحالية...');
    
    // حذف البيانات المرتبطة بالترتيب الصحيح
    console.log('حذف المنشورات...');
    await prisma.post.deleteMany({});
    
    console.log('حذف تعيينات الأدوار...');
    await prisma.userRoleAssignment.deleteMany({});
    
    console.log('حذف صلاحيات الأدوار...');
    await prisma.rolePermission.deleteMany({});
    
    console.log('حذف الأدوار...');
    await prisma.role.deleteMany({});
    
    console.log('حذف الصلاحيات...');
    await prisma.permission.deleteMany({});
    
    console.log('حذف المستخدمين...');
    await prisma.user.deleteMany({});
    
    console.log('✅ تم حذف جميع البيانات الحالية');
    
    console.log('👤 إنشاء حساب مدير النظام...');
    
    // إنشاء حساب مدير النظام
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'مدير النظام',
        email: 'admin@system.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ تم إنشاء حساب مدير النظام:', adminUser.email);
    
    console.log('👤 إنشاء حساب المستخدم المحدود...');
    
    // إنشاء حساب المستخدم المحدود
    const userPassword = await bcrypt.hash('user123', 10);
    const limitedUser = await prisma.user.create({
      data: {
        name: 'مستخدم محدود',
        email: 'user@system.com',
        password: userPassword,
        role: 'USER'
      }
    });
    
    console.log('✅ تم إنشاء حساب المستخدم المحدود:', limitedUser.email);
    
    console.log('\n📋 معلومات الحسابات الجديدة:');
    console.log('مدير النظام:');
    console.log('  البريد الإلكتروني: admin@system.com');
    console.log('  كلمة المرور: admin123');
    console.log('  الصلاحيات: كاملة');
    console.log('\nالمستخدم المحدود:');
    console.log('  البريد الإلكتروني: user@system.com');
    console.log('  كلمة المرور: user123');
    console.log('  الصلاحيات: محدودة');
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين المستخدمين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();