import { Module } from '@nestjs/common';
import { MysqlProviderModule } from './mysql';

/**
 * Provider Module
 * Centralizes all provider modules for dependency injection
 */
@Module({
  imports: [MysqlProviderModule],
  exports: [MysqlProviderModule],
})
export class ProviderModule {}
