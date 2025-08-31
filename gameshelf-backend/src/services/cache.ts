import Redis, { Redis as RedisType } from 'ioredis';
import { env } from '../config/environment.js';

class CacheService {
  private client: RedisType | null = null;
  private isEnabled = false;

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.client = new RedisType(env.REDIS_URL);
        this.isEnabled = true;
        console.log('✅ Redis connected successfully');
      } catch (error) {
        console.warn('⚠️  Redis connection failed, caching disabled');
        this.isEnabled = false;
      }
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isEnabled || !this.client) return null;
    
    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

export const cache = new CacheService();