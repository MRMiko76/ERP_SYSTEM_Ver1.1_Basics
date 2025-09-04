import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Custom login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await db.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          where: { active: true },
          include: {
            role: true
          }
        }
      }
    });

    console.log('👤 User found:', {
      email: user?.email,
      active: user?.active,
      hasPassword: !!user?.password,
      rolesCount: user?.userRoles?.length || 0
    });

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'الحساب غير نشط' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'لم يتم تعيين كلمة مرور لهذا الحساب' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // تحديد الدور الأساسي
    let primaryRole = 'USER';
    const roles: string[] = [];
    
    if (user.userRoles && user.userRoles.length > 0) {
      const activeRoles = user.userRoles
        .filter(ur => ur.active && ur.role?.active)
        .map(ur => ur.role?.name)
        .filter(Boolean) as string[];
      
      roles.push(...activeRoles);
      
      if (activeRoles.includes('مدير النظام')) {
        primaryRole = 'مدير النظام';
      } else if (activeRoles.includes('مدير')) {
        primaryRole = 'مدير';
      } else if (activeRoles.includes('مشرف عام')) {
        primaryRole = 'مشرف عام';
      }
    }

    console.log('🎭 User roles:', roles);
    console.log('👑 Primary role:', primaryRole);

    // إنشاء JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: primaryRole,
        roles: roles
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // تحديث آخر تسجيل دخول
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    console.log('✅ Login successful for:', email);

    // إرجاع النتيجة مع تعيين الكوكيز
    console.log('🍪 [LOGIN] Creating response with user data');
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: primaryRole,
        roles: roles
      }
    });

    // تعيين JWT في الكوكيز
    console.log('🍪 [LOGIN] Setting auth-token cookie');
    console.log('🍪 [LOGIN] Token length:', token.length);
    console.log('🍪 [LOGIN] Environment:', process.env.NODE_ENV);
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 أيام
    });
    
    console.log('🍪 [LOGIN] Cookie set successfully, returning response');
    return response;

  } catch (error) {
    console.error('💥 Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}