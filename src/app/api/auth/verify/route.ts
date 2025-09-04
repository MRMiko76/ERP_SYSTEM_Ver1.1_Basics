import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح بالدخول' },
        { status: 401 }
      );
    }

    // التحقق من صحة الـ token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;
    
    // جلب بيانات المستخدم الكاملة مع الأدوار من قاعدة البيانات
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
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
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحويل userRoles إلى roles للتوافق مع الواجهة الأمامية
    const { userRoles, ...userWithoutRoles } = user;
    const roles = userRoles?.map((ur: any) => ur.role) || [];
    const primaryRole = roles.length > 0 ? roles[0].name : 'USER';
    
    // تحديث آخر نشاط للمستخدم (بدون انتظار لتجنب إبطاء الاستجابة)
    db.user.update({
      where: { id: decoded.userId },
      data: { lastLogin: new Date() }
    }).catch(() => {
      // Silent fail for performance
    });
    
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
    
    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'رمز المصادقة غير صالح' },
      { status: 401 }
    );
  }
}