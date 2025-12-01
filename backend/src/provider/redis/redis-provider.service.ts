import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/common/constant/constant';

@Injectable()
export class RedisProviderService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /**
   * Returns the underlying Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Simple health check to ensure Redis is reachable
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Gracefully close the Redis connection when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

