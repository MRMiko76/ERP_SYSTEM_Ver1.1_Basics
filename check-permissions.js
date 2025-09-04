const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    const permissions = await prisma.permission.findMany();
    console.log('🔍 جميع الصلاحيات في النظام:');
    permissions.forEach(p => {
      console.log(`${p.id}: ${p.module}.${p.action}`);
    });
    
    console.log('\n📊 إحصائيات:');
    console.log(`إجمالي الصلاحيات: ${permissions.length}`);
    
    const modules = [...new Set(permissions.map(p => p.module))];
    console.log(`الوحدات: ${modules.join(', ')}`);
    
    const actions = [...new Set(permissions.map(p => p.action))];
    console.log(`الإجراءات: ${actions.join(', ')}`);
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();