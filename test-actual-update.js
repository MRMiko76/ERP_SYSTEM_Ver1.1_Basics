const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testActualUpdate() {
  try {
    console.log('🔍 Testing actual role permission update...');
    
    // Get the "بياع" (Salesperson) role for testing
    const role = await prisma.role.findFirst({
      where: { name: 'بياع' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!role) {
      console.log('❌ Salesperson role not found');
      return;
    }
    
    console.log(`📋 Testing with role: ${role.name} (ID: ${role.id})`);
    console.log(`📊 Current permissions count: ${role.permissions.length}`);
    console.log('Current permissions:');
    role.permissions.forEach(rp => {
      console.log(`   - ${rp.permission.module}.${rp.permission.action}`);
    });
    
    // Test data: Give salesperson limited permissions
    const testPermissions = [
      {
        module: 'users',
        actions: {
          view: true,    // read
          create: false,
          edit: false,
          delete: false,
          duplicate: false,
          approve: false,
          print: false
        }
      },
      {
        module: 'dashboard',
        actions: {
          view: true,    // read
          create: false,
          edit: false,
          delete: false,
          duplicate: false,
          approve: false,
          print: false
        }
      },
      {
        module: 'reports',
        actions: {
          view: true,    // read
          create: false,
          edit: false,
          delete: false,
          duplicate: false,
          approve: false,
          print: true    // export
        }
      }
    ];
    
    console.log('\n🔄 Applying new permissions...');
    
    // Convert frontend actions to database actions
    const actionMapping = {
      view: 'read',
      edit: 'update', 
      print: 'export',
      create: 'create',
      delete: 'delete'
    };
    
    const permissionsToCreate = [];
    
    for (const perm of testPermissions) {
      for (const [frontendAction, isEnabled] of Object.entries(perm.actions)) {
        if (isEnabled && actionMapping[frontendAction]) {
          const dbAction = actionMapping[frontendAction];
          
          // Find the permission in database
          const permission = await prisma.permission.findFirst({
            where: {
              module: perm.module,
              action: dbAction
            }
          });
          
          if (permission) {
            permissionsToCreate.push({
              roleId: role.id,
              permissionId: permission.id
            });
            console.log(`✅ Will add: ${perm.module}.${dbAction}`);
          } else {
            console.log(`⚠️ Permission not found: ${perm.module}.${dbAction}`);
          }
        }
      }
    }
    
    console.log(`\n📝 Total permissions to create: ${permissionsToCreate.length}`);
    
    // Perform the actual update
    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      const deleteResult = await tx.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      console.log(`🗑️ Deleted ${deleteResult.count} existing permissions`);
      
      // Create new permissions
      if (permissionsToCreate.length > 0) {
        const createResult = await tx.rolePermission.createMany({
          data: permissionsToCreate
        });
        console.log(`✨ Created ${createResult.count} new permissions`);
      }
    });
    
    // Verify the result
    const updatedRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log('\n🎯 Final permissions after update:');
    console.log(`📊 Total count: ${updatedRole.permissions.length}`);
    updatedRole.permissions.forEach(rp => {
      console.log(`   - ${rp.permission.module}.${rp.permission.action}`);
    });
    
    console.log('\n✅ Actual update completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActualUpdate();