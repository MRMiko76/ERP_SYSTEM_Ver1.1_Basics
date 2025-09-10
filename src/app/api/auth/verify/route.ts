import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

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

    // البحث عن المستخدم في قاعدة البيانات
    const user = await db.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        avatar: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود أو غير نشط' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
      message: 'تم التحقق بنجاح'
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { message: 'خطأ في التحقق من المصادقة' },
      { status: 401 }
    );
  }
}