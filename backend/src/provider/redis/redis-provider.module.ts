import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisProviders } from './redis.provider';
import { RedisProviderService } from './redis-provider.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [...redisProviders, RedisProviderService],
  exports: [...redisProviders, RedisProviderService],
})
export class RedisProviderModule {}

