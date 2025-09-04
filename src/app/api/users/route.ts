import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  console.log('🔍 API USERS GET: تم استلام طلب جلب المستخدمين');
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role && role !== 'all') {
      whereClause.userRoles = {
        some: {
          roleId: role,
        },
      };
    }
    
    if (active !== null && active !== undefined) {
      whereClause.active = active === 'true';
    }

    // Generate cache key based on query parameters
    const cacheKey = cache.generateKey(
      CACHE_KEYS.USERS,
      `page-${page}`,
      `limit-${limit}`,
      `search-${search || 'none'}`,
      `role-${role || 'all'}`,
      `active-${active || 'all'}`
    );

    // Try to get from cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereClause,
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
            select: {
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
        orderBy: [
          { active: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ]);

    // تحويل userRoles إلى roles لكل مستخدم للتوافق مع الواجهة الأمامية
    const processedUsers = users.map((user: any) => ({
      ...user,
      roles: user?.userRoles?.map((ur: any) => ur.role) || [],
      userRoles: undefined, // إزالة userRoles
    }));

    const result = {
      users: processedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };

    // Cache the result for 5 minutes
    await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);

    console.log('✅ API USERS: إرجاع النتيجة:', {
      usersCount: result.users.length,
      totalCount: result.pagination.total,
      users: result.users.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { name, username, email, password, phone, avatar, bio, role = 'USER', active = true, roles = [] } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'المستخدم موجود بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        phone,
        avatar,
        bio,
        role,
        active,
      },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Assign roles if provided
    if (roles.length > 0) {
      const userRoleAssignments = roles.map((roleId: string) => ({
        userId: user.id,
        roleId,
        active: true,
      }));

      // Create role assignments using Promise.all with upsert to handle duplicates
      await Promise.all(
        userRoleAssignments.map(assignment =>
          db.userRoleAssignment.upsert({
            where: {
              userId_roleId: {
                userId: assignment.userId,
                roleId: assignment.roleId,
              },
            },
            update: {
              active: assignment.active,
            },
            create: assignment,
          })
        )
      );
    }

    // Fetch user with roles
    const userWithRoles = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        avatar: true,
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
    const processedUser = {
      ...userWithRoles,
      roles: userWithRoles?.userRoles?.map((ur: any) => ur.role) || [],
      userRoles: undefined, // إزالة userRoles
    };

    // Clear users cache after creating new user
    const cachePattern = cache.generateKey(CACHE_KEYS.USERS, '*');
    // Since we can't use wildcards easily, we'll clear common cache keys
    for (let page = 1; page <= 10; page++) {
      for (const role of ['all', 'USER', 'ADMIN']) {
        for (const active of ['all', 'true', 'false']) {
          const keyToDelete = cache.generateKey(
            CACHE_KEYS.USERS,
            `page-${page}`,
            `limit-10`,
            `search-none`,
            `role-${role}`,
            `active-${active}`
          );
          await cache.del(keyToDelete);
        }
      }
    }

    return NextResponse.json(processedUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}