import NodeCache from 'node-cache';
import { createClient } from 'redis';

// In-memory cache for development
const nodeCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Better performance
});

// Redis client for production (optional)
let redisClient: any = null;

// Initialize Redis if available
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL
      });
      
      redisClient.on('error', (err: any) => {
        console.log('Redis Client Error', err);
        redisClient = null;
      });
      
      await redisClient.connect();
      console.log('Redis connected successfully');
    }
  } catch (error) {
    console.log('Redis connection failed, using in-memory cache:', error);
    redisClient = null;
  }
};

// Initialize Redis on startup
initRedis();

class CacheService {
  // Get value from cache
  async get(key: string): Promise<any> {
    try {
      // Try Redis first if available
      if (redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback to node-cache
      return nodeCache.get(key) || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set value in cache
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      // Try Redis first if available
      if (redisClient) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
      }
      
      // Fallback to node-cache
      return nodeCache.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete value from cache
  async del(key: string): Promise<boolean> {
    try {
      // Try Redis first if available
      if (redisClient) {
        await redisClient.del(key);
        return true;
      }
      
      // Fallback to node-cache
      return nodeCache.del(key) > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  async flush(): Promise<boolean> {
    try {
      // Try Redis first if available
      if (redisClient) {
        await redisClient.flushAll();
      }
      
      // Clear node-cache
      nodeCache.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Get cache statistics
  getStats() {
    return {
      nodeCache: nodeCache.getStats(),
      redis: redisClient ? 'connected' : 'not connected'
    };
  }

  // Generate cache key with prefix
  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Export singleton instance
export const cache = new CacheService();

// Cache key prefixes
export const CACHE_KEYS = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  USER_ROLES: 'user_roles',
  SESSION: 'session'
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 1800,     // 30 minutes
  VERY_LONG: 3600 // 1 hour
} as const;