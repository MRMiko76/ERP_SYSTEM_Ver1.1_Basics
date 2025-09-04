import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db as prisma } from '@/lib/db';

// POST /api/roles/seed - Create predefined roles
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Define predefined roles with their permissions
    const predefinedRoles = [
      {
        name: 'مشرف',
        description: 'مشرف النظام - صلاحيات كاملة',
        navigationPermissions: {
          users: true,
          roles: true,
          products: true,
          sales: true,
          purchases: true,
          customers: true,
          suppliers: true,
          inventory: true,
          reports: true,
          settings: true,
        },
        actionPermissions: {
          users: { create: true, read: true, update: true, delete: true, approve: true },
          roles: { create: true, read: true, update: true, delete: true, approve: true },
          products: { create: true, read: true, update: true, delete: true, approve: true },
          sales: { create: true, read: true, update: true, delete: true, approve: true },
          purchases: { create: true, read: true, update: true, delete: true, approve: true },
          customers: { create: true, read: true, update: true, delete: true, approve: true },
          suppliers: { create: true, read: true, update: true, delete: true, approve: true },
          inventory: { create: true, read: true, update: true, delete: true, approve: true },
          reports: { create: true, read: true, update: true, delete: true, approve: true },
          settings: { create: true, read: true, update: true, delete: true, approve: true },
        },
      },
      {
        name: 'مدير',
        description: 'مدير النظام - صلاحيات إدارية',
        navigationPermissions: {
          users: true,
          roles: false,
          products: true,
          sales: true,
          purchases: true,
          customers: true,
          suppliers: true,
          inventory: true,
          reports: true,
          settings: false,
        },
        actionPermissions: {
          users: { create: true, read: true, update: true, delete: false, approve: true },
          roles: { create: false, read: false, update: false, delete: false, approve: false },
          products: { create: true, read: true, update: true, delete: true, approve: true },
          sales: { create: true, read: true, update: true, delete: true, approve: true },
          purchases: { create: true, read: true, update: true, delete: true, approve: true },
          customers: { create: true, read: true, update: true, delete: true, approve: true },
          suppliers: { create: true, read: true, update: true, delete: true, approve: true },
          inventory: { create: true, read: true, update: true, delete: false, approve: true },
          reports: { create: false, read: true, update: false, delete: false, approve: false },
          settings: { create: false, read: false, update: false, delete: false, approve: false },
        },
      },
      {
        name: 'مستخدم',
        description: 'مستخدم عادي - صلاحيات محدودة',
        navigationPermissions: {
          users: false,
          roles: false,
          products: true,
          sales: true,
          purchases: false,
          customers: true,
          suppliers: false,
          inventory: true,
          reports: false,
          settings: false,
        },
        actionPermissions: {
          users: { create: false, read: false, update: false, delete: false, approve: false },
          roles: { create: false, read: false, update: false, delete: false, approve: false },
          products: { create: false, read: true, update: false, delete: false, approve: false },
          sales: { create: true, read: true, update: true, delete: false, approve: false },
          purchases: { create: false, read: false, update: false, delete: false, approve: false },
          customers: { create: true, read: true, update: true, delete: false, approve: false },
          suppliers: { create: false, read: false, update: false, delete: false, approve: false },
          inventory: { create: false, read: true, update: false, delete: false, approve: false },
          reports: { create: false, read: false, update: false, delete: false, approve: false },
          settings: { create: false, read: false, update: false, delete: false, approve: false },
        },
      },
    ];

    const createdRoles = [];

    // First, ensure all permissions exist
    const modules = ['users', 'roles', 'products', 'sales', 'purchases', 'customers', 'suppliers', 'inventory', 'reports', 'settings'];
    const actions = ['create', 'read', 'update', 'delete', 'approve'];
    
    for (const module of modules) {
      for (const action of actions) {
        await prisma.permission.upsert({
          where: {
            module_action: {
              module,
              action
            }
          },
          update: {},
          create: {
            name: `${module}_${action}`,
            description: `${action} permission for ${module} module`,
            module,
            action,
            active: true
          }
        });
      }
    }

    for (const roleData of predefinedRoles) {
      // Check if role already exists
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            active: true,
            createdById: currentUser.id,
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

        // Add permissions to the role
        for (const [module, modulePermissions] of Object.entries(roleData.actionPermissions)) {
          for (const [action, hasPermission] of Object.entries(modulePermissions as Record<string, boolean>)) {
            if (hasPermission) {
              const permission = await prisma.permission.findUnique({
                where: {
                  module_action: {
                    module,
                    action
                  }
                }
              });
              
              if (permission) {
                await prisma.rolePermission.create({
                  data: {
                    roleId: role.id,
                    permissionId: permission.id
                  }
                });
              }
            }
          }
        }

        createdRoles.push(role);
      }
    }

    return NextResponse.json({
      message: `تم إنشاء ${createdRoles.length} أدوار أساسية`,
      roles: createdRoles,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating predefined roles:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الأدوار الأساسية' },
      { status: 500 }
    );
  }
}