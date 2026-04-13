import Redis from 'ioredis';

import { env } from './env';
import { logger } from './logger';

class Cache {
  private client: Redis | null = null;
  private isConnected = false;

  connect() {
    if (!env.REDIS_URL) {
      logger.warn('Redis URL not provided, cache will be disabled');
      return;
    }

    if (this.client) {
      return;
    }

    try {
      this.client = new Redis(env.REDIS_URL);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis client connected');
      });

      this.client.on('error', (error) => {
        logger.error({ error }, 'Redis client error');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis client disconnected');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Redis client');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ key, error }, 'Cache get error');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error({ key, error }, 'Cache set error');
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error({ key, error }, 'Cache delete error');
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const keys: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const stream = this.client!.scanStream({
          match: `${prefix}*`,
          count: 100,
        });

        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });

        stream.on('end', () => resolve());
        stream.on('error', (error) => reject(error));
      });

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error({ prefix, error }, 'Cache pattern delete error');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client.removeAllListeners();
      this.client = null;
    }

    this.isConnected = false;
  }

  isConnectedToRedis(): boolean {
    return this.isConnected;
  }
}

export const cache = new Cache();
