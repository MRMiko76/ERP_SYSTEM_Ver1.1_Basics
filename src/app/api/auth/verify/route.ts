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
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        roles: decoded.roles || []
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