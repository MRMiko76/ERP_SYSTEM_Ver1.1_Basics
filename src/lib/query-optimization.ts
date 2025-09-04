/**
 * Query optimization utilities for database operations
 * This file contains optimized query patterns and utilities to improve performance
 */

import { db } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Optimized user queries with minimal data selection
export const optimizedUserQueries = {
  // Get users list with pagination and minimal data
  async getUsersList({
    search,
    role,
    active,
    page = 1,
    limit = 10,
  }: {
    search?: string;
    role?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) {
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
          active: true,
        },
      };
    }
    
    if (active !== undefined) {
      whereClause.active = active;
    }

    // Use Promise.all for parallel execution
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          avatar: true,
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

    return {
      users: users.map((user: any) => ({
        ...user,
        roles: user.userRoles?.map((ur: any) => ur.role) || [],
        userRoles: undefined,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };
  },

  // Get user by ID with optimized relations
  async getUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        avatar: true,
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
                permissions: {
                  select: {
                    permission: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        module: true,
                        action: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
};

// Optimized role queries
export const optimizedRoleQueries = {
  // Get roles list with caching
  async getRolesList() {
    const cacheKey = cache.generateKey(CACHE_KEYS.ROLES, 'optimized-list');
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const roles = await db.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true,
                action: true,
              },
            },
          },
        },
        _count: {
          select: {
            userRoles: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    await cache.set(cacheKey, roles, CACHE_TTL.MEDIUM);
    return roles;
  },

  // Get role by ID with optimized relations
  async getRoleById(id: string) {
    const cacheKey = cache.generateKey(CACHE_KEYS.ROLES, 'detail', id);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const role = await db.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true,
                action: true,
              },
            },
          },
        },
        userRoles: {
          where: { active: true },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                active: true,
              },
            },
          },
        },
        _count: {
          select: {
            userRoles: {
              where: { active: true },
            },
          },
        },
      },
    });

    if (role) {
      await cache.set(cacheKey, role, CACHE_TTL.SHORT);
    }

    return role;
  },
};

// Optimized permission queries
export const optimizedPermissionQueries = {
  // Get user permissions with caching
  async getUserPermissions(userEmail: string) {
    const cacheKey = cache.generateKey(CACHE_KEYS.USERS, 'permissions', userEmail);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        userRoles: {
          where: { active: true },
          select: {
            role: {
              where: { active: true },
              select: {
                id: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        module: true,
                        action: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (user) {
      await cache.set(cacheKey, user, CACHE_TTL.SHORT);
    }

    return user;
  },
};

// Batch operations for better performance
export const batchOperations = {
  // Batch create user role assignments
  async batchCreateUserRoles(assignments: { userId: string; roleId: string }[]) {
    return Promise.all(
      assignments.map(assignment =>
        db.userRoleAssignment.upsert({
          where: {
            userId_roleId: {
              userId: assignment.userId,
              roleId: assignment.roleId,
            },
          },
          update: {
            active: true,
          },
          create: {
            ...assignment,
            active: true,
          },
        })
      )
    );
  },

  // Batch update user statuses
  async batchUpdateUserStatus(userIds: string[], active: boolean) {
    return db.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        active,
      },
    });
  },
};

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate user-related caches
  async invalidateUserCaches(userId?: string) {
    const patterns = [
      CACHE_KEYS.USERS,
      ...(userId ? [`${CACHE_KEYS.USERS}:*:${userId}`] : []),
    ];
    
    await Promise.all(
      patterns.map(pattern => cache.invalidatePattern(pattern))
    );
  },

  // Invalidate role-related caches
  async invalidateRoleCaches(roleId?: string) {
    const patterns = [
      CACHE_KEYS.ROLES,
      ...(roleId ? [`${CACHE_KEYS.ROLES}:*:${roleId}`] : []),
    ];
    
    await Promise.all(
      patterns.map(pattern => cache.invalidatePattern(pattern))
    );
  },
};