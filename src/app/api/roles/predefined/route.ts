import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Define predefined roles with their permissions
    const predefinedRoles = [
      {
        name: "مستخدم",
        description: "دور المستخدم العادي مع صلاحيات محدودة",
        active: true,
        navigationPermissions: {
          dashboard: true,
          users: false,
          roles: false,
          products: true,
          orders: true,
          customers: true,
          suppliers: false,
          inventory: true,
          reports: false,
          settings: false,
          accounting: false,
          hr: false,
          crm: true,
          pos: true,
          ecommerce: true
        },
        actionPermissions: {
          create: false,
          read: true,
          update: false,
          delete: false,
          export: false,
          print: true,
          approve: false,
          reject: false,
          archive: false,
          restore: false
        }
      },
      {
        name: "مدير",
        description: "دور المدير مع صلاحيات إدارية متوسطة",
        active: true,
        navigationPermissions: {
          dashboard: true,
          users: true,
          roles: false,
          products: true,
          orders: true,
          customers: true,
          suppliers: true,
          inventory: true,
          reports: true,
          settings: false,
          accounting: true,
          hr: true,
          crm: true,
          pos: true,
          ecommerce: true
        },
        actionPermissions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          export: true,
          print: true,
          approve: true,
          reject: true,
          archive: true,
          restore: true
        }
      },
      {
        name: "مشرف",
        description: "دور المشرف مع جميع الصلاحيات",
        active: true,
        navigationPermissions: {
          dashboard: true,
          users: true,
          roles: true,
          products: true,
          orders: true,
          customers: true,
          suppliers: true,
          inventory: true,
          reports: true,
          settings: true,
          accounting: true,
          hr: true,
          crm: true,
          pos: true,
          ecommerce: true
        },
        actionPermissions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          export: true,
          print: true,
          approve: true,
          reject: true,
          archive: true,
          restore: true
        }
      }
    ];

    // Create roles one by one
    const createdRoles = [];
    for (const roleData of predefinedRoles) {
      // Check if role already exists
      const existingRole = await prisma.role.findFirst({
        where: { name: roleData.name }
      });

      if (!existingRole) {
        const role = await prisma.role.create({
          data: roleData
        });
        createdRoles.push(role);
      }
    }

    return NextResponse.json({
      message: "تم إنشاء الأدوار الأساسية بنجاح",
      roles: createdRoles,
      count: createdRoles.length
    });
  } catch (error) {
    console.error("Error creating predefined roles:", error);
    return NextResponse.json(
      { error: "فشل في إنشاء الأدوار الأساسية" },
      { status: 500 }
    );
  }
}