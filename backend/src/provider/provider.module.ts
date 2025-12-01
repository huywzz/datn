import { Module } from '@nestjs/common';
import { MysqlProviderModule } from './mysql';
import { RedisProviderModule } from './redis/redis-provider.module';

/**
 * Provider Module
 * Centralizes all provider modules for dependency injection
 */
@Module({
  imports: [MysqlProviderModule, RedisProviderModule],
  exports: [MysqlProviderModule, RedisProviderModule],
})
export class ProviderModule {}
