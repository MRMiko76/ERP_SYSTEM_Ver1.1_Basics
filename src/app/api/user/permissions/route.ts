import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db as prisma } from '@/lib/db';

// GET /api/user/permissions - Get current user's permissions
export async function GET(request: NextRequest) {
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

    // Get current user with their roles and permissions
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      include: {
        userRoles: {
          where: { active: true },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Collect all permissions from all active roles
    const permissions = new Map();
    
    user.userRoles.forEach(userRole => {
      if (userRole.role.active) {
        userRole.role.permissions.forEach(rolePermission => {
          const permission = rolePermission.permission;
          const key = `${permission.module}_${permission.action}`;
          permissions.set(key, permission);
        });
      }
    });

    // Convert to array and group by module
    const permissionsArray = Array.from(permissions.values());
    const groupedPermissions = permissionsArray.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      permissions: permissionsArray,
      groupedPermissions,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        active: ur.role.active,
      })),
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    // إذا كان الخطأ متعلق بـ JWT، إرجاع 401
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'خطأ في جلب صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}