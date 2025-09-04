import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        avatar: true,
        bio: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          where: { active: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: {
                  include: {
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
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحويل userRoles إلى roles للتوافق مع الواجهة الأمامية
    const responseUser = {
      ...user,
      roles: user?.userRoles?.map((ur: any) => ur.role) || [],
    };
    
    // إزالة userRoles من الاستجابة
    delete responseUser.userRoles;
    
    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب المستخدم' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔥 API PUT /users/[id]: بدء معالجة طلب تحديث المستخدم');
    console.log('🔥 API PUT /users/[id]: معرف المستخدم:', id);
    
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      console.log('🔥 API PUT /users/[id]: ❌ غير مصرح بالوصول');
      return NextResponse.json(
          { message: 'غير مصرح لك بالوصول' },
          { status: 401 }
        );
    }

    // التحقق من صحة الـ token
    jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );

    const body = await request.json();
    console.log('🔥 API PUT /users/[id]: البيانات المستلمة:', JSON.stringify(body, null, 2));
    const { name, username, email, password, phone, avatar, bio, role, active, roles = [] } = body;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
          { message: 'المستخدم غير موجود' },
          { status: 404 }
        );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const userWithSameEmail = await db.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        return NextResponse.json(
          { message: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    //- By Eng-Mo Sef
    // استخدم معاملة لتحديث المستخدم والأدوار معًا مع زيادة المهلة الزمنية
    const updatedUser = await db.$transaction(async (prisma) => {
      // تحديث بيانات المستخدم الأساسية
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // تحديث الأدوار فقط إذا تم توفيرها
      if (roles) {
        // الحصول على الأدوار الحالية للمستخدم
        const existingAssignments = await prisma.userRoleAssignment.findMany({
          where: { userId: id },
          select: { roleId: true },
        });
        const existingRoleIds = existingAssignments.map(a => a.roleId);

        // تحديد الأدوار التي يجب إضافتها وحذفها
        const rolesToAdd = roles.filter((roleId: string) => !existingRoleIds.includes(roleId));
        const rolesToRemove = existingRoleIds.filter((roleId: string) => !roles.includes(roleId));

        // إضافة الأدوار الجديدة
        if (rolesToAdd.length > 0) {
          await prisma.userRoleAssignment.createMany({
            data: rolesToAdd.map((roleId: string) => ({
              userId: id,
              roleId,
              active: true,
            })),
          });
        }

        // حذف الأدوار القديمة
        if (rolesToRemove.length > 0) {
          await prisma.userRoleAssignment.deleteMany({
            where: {
              userId: id,
              roleId: { in: rolesToRemove },
            },
          });
        }
      }

      return user;
    }, {
      timeout: 15000, // زيادة المهلة إلى 15 ثانية
    });

    // Fetch updated user with roles
    const userWithRoles = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          where: { active: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // تحويل userRoles إلى roles للتوافق مع الواجهة الأمامية
    const responseUser = {
      ...userWithRoles,
      roles: userWithRoles?.userRoles?.map((ur: any) => ur.role) || [],
    };
    
    // إزالة userRoles من الاستجابة
    delete responseUser.userRoles;
    
    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token والحصول على معلومات المستخدم
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if user is trying to delete themselves
    const currentUser = await db.user.findUnique({
      where: { email: decoded.email },
    });

    if (currentUser?.id === id) {
      return NextResponse.json(
          { message: 'لا يمكنك حذف حسابك الخاص' },
          { status: 400 }
        );
    }

    // Delete user role assignments first
    await db.userRoleAssignment.deleteMany({
      where: { userId: id },
    });

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'تم حذف المستخدم بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
        { message: 'خطأ في حذف المستخدم' },
        { status: 500 }
      );
  }
}