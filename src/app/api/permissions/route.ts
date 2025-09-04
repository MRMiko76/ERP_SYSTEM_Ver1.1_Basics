import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SYSTEM_MODULES, ACTION_LABELS } from '@/types/roles-permissions';

// GET /api/permissions - الحصول على جميع الصلاحيات المتاحة
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


    // إنشاء قائمة بجميع الصلاحيات المتاحة
    const permissions = SYSTEM_MODULES.map(module => ({
      module: module.name,
      displayName: module.displayName,
      description: module.description,
      actions: Object.entries(ACTION_LABELS).map(([action, label]) => ({
        action,
        label,
        available: true
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        modules: SYSTEM_MODULES,
        actions: ACTION_LABELS,
        permissions
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على الصلاحيات:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}