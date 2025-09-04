import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db as prisma } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const resolvedParams = await params;
    const role = await prisma.role.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true,
                action: true,
              },
            },
          },
        },
        userRoles: {
          where: { active: true },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                active: true,
              },
            },
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Transform permissions to the expected format for the frontend
    const modules = ['users', 'roles', 'products', 'sales', 'purchases', 'customers', 'suppliers', 'inventory', 'reports', 'settings', 'dashboard'];
    const actions = ['view', 'create', 'edit', 'delete', 'duplicate', 'approve', 'print'];

    // Initialize actionPermissions for backward compatibility
    const actionPermissions: Record<string, Record<string, boolean>> = {};
    modules.forEach(module => {
      actionPermissions[module] = {};
      actions.forEach(action => {
        actionPermissions[module][action] = false;
      });
    });

    // Set actual permissions in actionPermissions - convert DB actions to frontend actions
    role.permissions.forEach((rp: any) => {
      const module = rp.permission.module;
      const dbAction = rp.permission.action;
      
      if (actionPermissions[module]) {
        // Convert database action names to frontend action names
        switch (dbAction) {
          case 'read':
            actionPermissions[module]['view'] = true;
            break;
          case 'update':
            actionPermissions[module]['edit'] = true;
            break;
          case 'export':
            actionPermissions[module]['print'] = true;
            break;
          case 'create':
          case 'delete':
            actionPermissions[module][dbAction] = true;
            break;
          default:
            // For any other actions, keep as is
            actionPermissions[module][dbAction] = true;
        }
      }
    });

    // Create permissions array in the format expected by the frontend form
    const permissions = modules.map(module => {
      return {
        module: module,
        actions: {
          view: actionPermissions[module]['view'] || false,
          create: actionPermissions[module]['create'] || false,
          edit: actionPermissions[module]['edit'] || false,
          delete: actionPermissions[module]['delete'] || false,
          duplicate: actionPermissions[module]['duplicate'] || false,
          approve: actionPermissions[module]['approve'] || false,
          print: actionPermissions[module]['print'] || false,
        }
      };
    });
    
    const roleWithParsedPermissions = {
      ...role,
      actionPermissions, // Keep for backward compatibility
      permissions, // Add the new format for the form
    };

    return NextResponse.json(roleWithParsedPermissions);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الدور' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const resolvedParams = await params;
    const body = await request.json();
    console.log('🔥 API PUT /api/roles/[id] - Received data:', JSON.stringify(body, null, 2));
    
    const { 
      name, 
      description, 
      active, 
      permissions = []
    } = body;
    
    console.log('🔥 API PUT - Extracted permissions:', JSON.stringify(permissions, null, 2));
    console.log('🔥 API PUT - Permissions type:', typeof permissions);
    console.log('🔥 API PUT - Is permissions array:', Array.isArray(permissions));
    console.log('🔥 API PUT - Permissions length:', permissions.length);

    // Convert permissions array to actionPermissions object
    let finalActionPermissions = {};
    
    console.log('🔥 API PUT - Processing permissions, length:', permissions.length);
    
    // Check if permissions is in the new format (array of {module, actions})
    if (Array.isArray(permissions) && permissions.length > 0) {
      // Check if it's the new format with module and actions
        if (permissions[0] && typeof permissions[0] === 'object' && 'module' in permissions[0] && 'actions' in permissions[0]) {
          console.log('🔥 API PUT - Using NEW format (module/actions)');
          // New format: [{module: 'users', actions: {view: true, create: false, ...}}, ...]
          permissions.forEach((permission: any) => {
            if (permission.module && permission.actions) {
              // Convert frontend action names to database action names
              const dbActions = {
                create: permission.actions.create || false,
                read: permission.actions.view || false, // view -> read
                update: permission.actions.edit || false, // edit -> update  
                delete: permission.actions.delete || false,
                export: permission.actions.print || false, // print -> export
                // Note: duplicate and approve don't exist in current DB schema
              };
              finalActionPermissions[permission.module] = dbActions;
              console.log(`🔥 API PUT - Added module ${permission.module}:`, dbActions);
              console.log(`🔥 API PUT - Original frontend actions:`, permission.actions);
            }
          });
      } else {
        // Old format: array of permission IDs
        // Get all permissions from database to map IDs to modules/actions
        const allPermissions = await prisma.permission.findMany();
        const permissionMap = new Map(allPermissions.map(p => [p.id, { module: p.module, action: p.action }]));
        
        // Initialize all modules with false values
        const modules = ['users', 'roles', 'products', 'sales', 'purchases', 'customers', 'suppliers', 'inventory', 'reports', 'settings', 'dashboard'];
        const actions = ['create', 'view', 'edit', 'delete', 'approve', 'duplicate', 'print'];
        
        modules.forEach(module => {
          finalActionPermissions[module] = {};
          actions.forEach(action => {
            finalActionPermissions[module][action] = false;
          });
        });
        
        // Set selected permissions to true
        permissions.forEach(permissionId => {
          const permissionInfo = permissionMap.get(permissionId);
          if (permissionInfo) {
            const { module, action } = permissionInfo;
            if (!finalActionPermissions[module]) {
              finalActionPermissions[module] = {};
            }
            finalActionPermissions[module][action] = true;
          }
        });
      }
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another role
    if (name && name !== existingRole.name) {
      const roleWithSameName = await prisma.role.findUnique({
        where: { name },
      });

      if (roleWithSameName) {
        return NextResponse.json(
          { error: 'اسم الدور موجود بالفعل' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    console.log('🔥 API PUT - Final action permissions:', JSON.stringify(finalActionPermissions, null, 2));
    
    // Use transaction to ensure data consistency
    console.log('🔥 API PUT - Starting transaction for permissions update...');
    console.log('🔥 API PUT - Role ID:', resolvedParams.id);
    
    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      console.log('🔥 API PUT - Deleting existing permissions for role:', resolvedParams.id);
      const deletedCount = await tx.rolePermission.deleteMany({
        where: { roleId: resolvedParams.id }
      });
      console.log('🔥 API PUT - Deleted permissions count:', deletedCount.count);

      // Prepare permissions data for bulk insert
      const permissionsToCreate = [];
      
      for (const [module, modulePermissions] of Object.entries(finalActionPermissions)) {
        for (const [action, hasPermission] of Object.entries(modulePermissions as Record<string, boolean>)) {
          if (hasPermission) {
            const permission = await tx.permission.findUnique({
              where: {
                module_action: {
                  module,
                  action
                }
              }
            });
            
            if (permission) {
              permissionsToCreate.push({
                roleId: updatedRole.id,
                permissionId: permission.id
              });
              console.log(`✅ Permission found and added: ${module}.${action}`);
            } else {
              console.log(`⚠️ Permission not found (skipping): ${module}.${action}`);
            }
          }
        }
      }
      
      // Bulk create permissions
      console.log('🔥 API PUT - Permissions to create:', permissionsToCreate.length);
      console.log('🔥 API PUT - Permissions data:', JSON.stringify(permissionsToCreate, null, 2));
      
      if (permissionsToCreate.length > 0) {
        const createdResult = await tx.rolePermission.createMany({
          data: permissionsToCreate
        });
        console.log(`🔥 API PUT - Bulk created ${createdResult.count} permissions`);
        console.log('🔥 API PUT - Create result:', JSON.stringify(createdResult, null, 2));
      } else {
        console.log('🔥 API PUT - No permissions to create!');
      }
    });
    
    // Clear cache after successful update
    console.log('🔥 API PUT - Clearing permissions cache...');
    await cache.del(`${CACHE_KEYS.PERMISSIONS}:*`);
    await cache.del(`${CACHE_KEYS.USER_ROLES}:*`);
    await cache.del(`${CACHE_KEYS.ROLES}:*`);
    console.log('🔥 API PUT - Cache cleared successfully');
    
    // Permissions updated successfully - cache cleared and users will get updated permissions on next request
    console.log('🔥 API PUT - Permissions update completed successfully');

    // Get updated role with permissions for response
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: resolvedParams.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Transform to the expected format - convert DB actions back to frontend format
    const transformedRole = {
      id: roleWithPermissions!.id,
      name: roleWithPermissions!.name,
      description: roleWithPermissions!.description || undefined,
      active: roleWithPermissions!.active,
      permissions: Object.entries(finalActionPermissions).map(([module, actions]: [string, any]) => ({
        module,
        actions: {
          view: actions.read || false, // read -> view
          create: actions.create || false,
          edit: actions.update || false, // update -> edit
          delete: actions.delete || false,
          duplicate: false, // not supported in current DB
          approve: false, // not supported in current DB
          print: actions.export || false, // export -> print
        }
      })),
      createdAt: roleWithPermissions!.createdAt,
      updatedAt: roleWithPermissions!.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedRole,
      message: 'تم تحديث الدور بنجاح'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الدور' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const resolvedParams = await params;
    
    // Check if there are users assigned to this role
    const usersWithRole = await prisma.userRoleAssignment.findMany({
      where: { roleId: resolvedParams.id }
    });

    if (usersWithRole.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف هذا الدور لأنه مرتبط بمستخدمين' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: resolvedParams.id }
    });

    // Then delete the role
    await prisma.role.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json(
      { message: 'تم حذف الدور بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف الدور' },
      { status: 500 }
    );
  }
}