import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db as prisma } from '@/lib/db';
import {
  Role,
  CreateRoleData,
  Permission,
  SYSTEM_MODULES,
  createDefaultPermission
} from '@/types/roles-permissions';

// GET /api/roles - الحصول على جميع الأدوار
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    // الحصول على الأدوار مع الصلاحيات
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.role.count({ where })
    ]);

    // تحويل البيانات إلى البنية الجديدة
    const transformedRoles: Role[] = roles.map(role => {
      // Transform permissions to the expected format
      const actionPermissions: Record<string, Record<string, boolean>> = {};
      
      // Initialize all modules with false values
      const modules = ['users', 'roles', 'products', 'sales', 'purchases', 'customers', 'suppliers', 'inventory', 'reports', 'settings', 'dashboard'];
      const actions = ['view', 'create', 'edit', 'delete', 'duplicate', 'approve', 'print'];
      
      modules.forEach(module => {
        actionPermissions[module] = {};
        actions.forEach(action => {
          actionPermissions[module][action] = false;
        });
      });

      // Set permissions based on role permissions - convert DB actions to frontend actions
      role.permissions.forEach((rp: any) => {
        const moduleKey = rp.permission.module;
        const dbAction = rp.permission.action;
        
        if (actionPermissions[moduleKey]) {
          // Convert database action names to frontend action names
          switch (dbAction) {
            case 'read':
              actionPermissions[moduleKey]['view'] = true;
              break;
            case 'update':
              actionPermissions[moduleKey]['edit'] = true;
              break;
            case 'export':
              actionPermissions[moduleKey]['print'] = true;
              break;
            case 'create':
            case 'delete':
              actionPermissions[moduleKey][dbAction] = true;
              break;
            default:
              // For any other actions, keep as is
              if (actionPermissions[moduleKey][dbAction] !== undefined) {
                actionPermissions[moduleKey][dbAction] = true;
              }
          }
        }
      });

      // إنشاء صلاحيات لجميع الموديولات
      const permissions: Permission[] = modules.map(module => {
        return {
          module: module,
          actions: actionPermissions[module]
        };
      });

      return {
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        active: role.active,
        permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على الأدوار:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}

// POST /api/roles - إنشاء دور جديد
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
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
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const body: CreateRoleData = await request.json();
    const { name, description, active, permissions } = body;

    // التحقق من صحة البيانات
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'اسم الدور مطلوب ويجب أن يكون على الأقل حرفين' },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'الصلاحيات يجب أن تكون مصفوفة' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود دور بنفس الاسم
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'يوجد دور بنفس الاسم بالفعل' },
        { status: 400 }
      );
    }

    // إنشاء الدور
    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active: active ?? true,
        createdById: currentUser.id
      }
    });

    // إنشاء الصلاحيات
    const permissionPromises: Promise<any>[] = [];
    
    for (const permission of permissions) {
      for (const [action, enabled] of Object.entries(permission.actions)) {
        if (enabled) {
          // البحث عن الصلاحية أو إنشاؤها
          const permissionRecord = await prisma.permission.upsert({
            where: {
              module_action: {
                module: permission.module,
                action: action
              }
            },
            update: {},
            create: {
              name: `${permission.module}_${action}`,
              module: permission.module,
              action: action,
              description: `${action} permission for ${permission.module} module`
            }
          });

          // ربط الصلاحية بالدور
          permissionPromises.push(
            prisma.rolePermission.create({
              data: {
                roleId: newRole.id,
                permissionId: permissionRecord.id
              }
            })
          );
        }
      }
    }

    await Promise.all(permissionPromises);

    // الحصول على الدور مع الصلاحيات
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: newRole.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // تحويل البيانات
    const transformedRole: Role = {
      id: roleWithPermissions!.id,
      name: roleWithPermissions!.name,
      description: roleWithPermissions!.description || undefined,
      active: roleWithPermissions!.active,
      permissions: SYSTEM_MODULES.map(module => {
        const modulePermissions = roleWithPermissions!.permissions.filter(
          rp => rp.permission.module === module.name
        );
        
        const actions = {
          view: false,
          create: false,
          edit: false,
          delete: false,
          duplicate: false,
          approve: false,
          print: false
        };
        
        modulePermissions.forEach(rp => {
          const action = rp.permission.action as keyof typeof actions;
          if (action in actions) {
            actions[action] = true;
          }
        });
        
        return {
          module: module.name,
          actions
        };
      }),
      createdAt: roleWithPermissions!.createdAt,
      updatedAt: roleWithPermissions!.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedRole,
      message: 'تم إنشاء الدور بنجاح'
    }, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء الدور:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}