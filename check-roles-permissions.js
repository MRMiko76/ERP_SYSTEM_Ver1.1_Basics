const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRolesPermissions() {
  try {
    console.log('🔍 Checking available permissions for roles module...');
    
    const rolesPermissions = await prisma.permission.findMany({
      where: { module: 'roles' }
    });
    
    console.log(`📊 Found ${rolesPermissions.length} permissions for roles module:`);
    rolesPermissions.forEach(p => {
      console.log(`   - ${p.module}.${p.action} (ID: ${p.id})`);
    });
    
    console.log('\n🔍 Checking all available actions across all modules...');
    const allActions = await prisma.permission.findMany({
      select: { action: true },
      distinct: ['action']
    });
    
    console.log('📋 Available actions:');
    allActions.forEach(a => {
      console.log(`   - ${a.action}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRolesPermissions();