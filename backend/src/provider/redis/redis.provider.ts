import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_CLIENT } from 'src/common/constant/constant';


const logger = new Logger('RedisProvider');

const createRedisOptions = (configService: ConfigService): RedisOptions => {
  const host = configService.get<string>('REDIS_HOST', '127.0.0.1');
  const port = configService.get<number>('REDIS_PORT', 6379);
//   const password = configService.get<string>('REDIS_PASSWORD');
//   const db = configService.get<number>('REDIS_DB', 0);
//   const keyPrefix = configService.get<string>('REDIS_KEY_PREFIX');
  const tlsEnabled = configService.get<string>('REDIS_TLS_ENABLED', 'false') === 'true';

  const options: RedisOptions = {
    host,
    port,
    lazyConnect: false,
    // password: password || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  if (tlsEnabled) {
    options.tls = {};
  }

  return options;
};

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const options = createRedisOptions(configService);
    const client = new Redis(options);

    client.on('connect', () => logger.log('Connected to Redis'));
    client.on('error', (error) => logger.error(`Redis error: ${error.message}`, error.stack));
    client.on('close', () => logger.warn('Redis connection closed'));

    return client;
  },
  inject: [ConfigService],
};

export const redisProviders: Provider[] = [redisProvider];

