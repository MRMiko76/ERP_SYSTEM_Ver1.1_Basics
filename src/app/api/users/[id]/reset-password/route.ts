import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// دالة لتوليد كلمة مرور عشوائية آمنة
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // ضمان وجود حرف واحد على الأقل من كل نوع
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // إكمال باقي الأحرف عشوائياً
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // خلط الأحرف
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // انتظار params قبل الاستخدام (متطلب Next.js 15)
    const { id } = await params;
    
    // التحقق من صحة التوكن من cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
      console.log('🔍 Full decoded token:', decoded);
      console.log('🔍 Decoded token keys:', Object.keys(decoded));
      console.log('🔍 Decoded token userId:', decoded.userId);
      console.log('🔍 Decoded token email:', decoded.email);
    } catch (error) {
      console.error('❌ خطأ في فك تشفير التوكن:', error);
      return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });
    }

    // التحقق من صحة معرف المستخدم
    if (!decoded.userId) {
      console.error('❌ معرف المستخدم مفقود في التوكن');
      console.error('❌ محتوى التوكن الكامل:', decoded);
      return NextResponse.json({ error: 'معرف المستخدم غير صحيح' }, { status: 401 });
    }

    // البحث عن أي مدير نظام نشط للتحقق من الصلاحيات
    console.log('🔍 البحث عن مدير النظام للتحقق من الصلاحيات...');
    const authenticatedUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'مدير النظام'
            },
            active: true
          }
        },
        active: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!authenticatedUser) {
      console.log('❌ لم يتم العثور على مدير نظام نشط');
      return NextResponse.json({ error: 'غير مصرح لك بهذا الإجراء' }, { status: 403 });
    }

    console.log('✅ تم العثور على مدير النظام:', { id: authenticatedUser.id, name: authenticatedUser.name, email: authenticatedUser.email });

    // التحقق من صلاحية تعديل المستخدمين
    const hasUpdatePermission = authenticatedUser.userRoles.some(userRole => 
      userRole.role.permissions.some(rolePermission => 
        rolePermission.permission.module === 'users' && 
        rolePermission.permission.action === 'update'
      )
    ) || authenticatedUser.role === 'ADMIN';

    if (!hasUpdatePermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لإعادة تعيين كلمات المرور' }, { status: 403 });
    }

    // التحقق من وجود المستخدم المراد إعادة تعيين كلمة مروره
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم المطلوب غير موجود' }, { status: 404 });
    }

    // توليد كلمة مرور جديدة
    const newPassword = generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // تحديث كلمة المرور في قاعدة البيانات
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log(`🔑 تم إعادة تعيين كلمة المرور للمستخدم: ${targetUser.email} بواسطة: ${authenticatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
      newPassword: newPassword,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      }
    });

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إعادة تعيين كلمة المرور' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}