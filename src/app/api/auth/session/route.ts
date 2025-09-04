import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Add cache control headers to prevent caching issues
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ session: null }, { status: 200, headers });
    }

    // التحقق من صحة الـ token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    // Get user data
    const user = await db.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        userRoles: {
          where: { active: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.active) {
      return NextResponse.json({ session: null }, { status: 200, headers });
    }
    
    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.userRoles.map(ur => ur.role)
      }
    };
    
    return NextResponse.json({ session }, { headers });
  } catch (error) {
    console.error("Session API Error:", error);
    
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache', 
      'Expires': '0'
    };
    
    return NextResponse.json({ session: null, error: "Session error" }, { status: 200, headers });
  }
}