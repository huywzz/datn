import { Module } from '@nestjs/common';
import { FirebaseProviderModule } from './firebase/firebase.module';
import { MysqlProviderModule } from './mysql';
import { RedisProviderModule } from './redis/redis-provider.module';

/**
 * Provider Module
 * Centralizes all provider modules for dependency injection
 */
@Module({
  imports: [MysqlProviderModule, RedisProviderModule, FirebaseProviderModule],
  exports: [MysqlProviderModule, RedisProviderModule, FirebaseProviderModule],
})
export class ProviderModule {}
