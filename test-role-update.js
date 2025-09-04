const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleUpdate() {
  try {
    console.log('🔍 Testing role permission update...');
    
    // Get the first role
    const role = await prisma.role.findFirst({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!role) {
      console.log('❌ No roles found in database');
      return;
    }
    
    console.log(`📋 Testing with role: ${role.name} (ID: ${role.id})`);
    console.log(`📊 Current permissions count: ${role.permissions.length}`);
    
    // Simulate frontend data (with frontend action names)
    const testPermissions = [
      {
        module: 'users',
        actions: {
          view: true,
          create: true,
          edit: false,
          delete: false,
          duplicate: false,
          approve: false,
          print: false
        }
      },
      {
        module: 'roles',
        actions: {
          view: true,
          create: false,
          edit: true,
          delete: false,
          duplicate: false,
          approve: false,
          print: true
        }
      }
    ];
    
    console.log('🔄 Simulating API conversion...');
    
    // Convert frontend actions to database actions (same logic as API)
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
            console.log(`✅ Mapped ${perm.module}.${frontendAction} -> ${perm.module}.${dbAction}`);
          } else {
            console.log(`❌ Permission not found: ${perm.module}.${dbAction}`);
          }
        }
      }
    }
    
    console.log(`📝 Permissions to create: ${permissionsToCreate.length}`);
    
    // Test the transaction (without actually committing)
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
      
      // Verify the result
      const newPermissions = await tx.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });
      
      console.log('🎯 Final permissions:');
      newPermissions.forEach(rp => {
        console.log(`   - ${rp.permission.module}.${rp.permission.action}`);
      });
      
      // Rollback for testing
      throw new Error('Rollback for testing - no actual changes made');
    });
    
  } catch (error) {
    if (error.message === 'Rollback for testing - no actual changes made') {
      console.log('✅ Test completed successfully (rolled back)');
    } else {
      console.error('❌ Test failed:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testRoleUpdate();