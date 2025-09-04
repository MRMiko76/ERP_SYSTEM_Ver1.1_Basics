import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    // Get current user
    const user = await db.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        active: true,
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

    if (!user) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحويل userRoles إلى roles للتوافق مع الواجهة الأمامية
    const responseUser = {
      ...user,
      roles: user.userRoles?.map((ur: any) => ur.role) || [],
    };
    
    // إزالة userRoles من الاستجابة
    delete responseUser.userRoles;
    
    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب الملف الشخصي' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    const body = await request.json();
    const { name, email, phone, avatar, bio, currentPassword, newPassword } = body;

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { email: decoded.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== currentUser.email) {
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
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    // Handle password change
    if (newPassword && currentPassword) {
      // Verify current password
      if (!currentUser.password) {
        return NextResponse.json(
          { message: 'لم يتم تعيين كلمة مرور لهذا الحساب' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        active: true,
        lastLoginAt: true,
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
      ...updatedUser,
      roles: updatedUser.userRoles?.map((ur: any) => ur.role) || [],
    };
    
    // إزالة userRoles من الاستجابة
    delete responseUser.userRoles;
    
    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'خطأ في تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
}