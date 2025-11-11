import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MysqlProviderService } from './mysql-provider.service';
import { getTypeOrmConfig } from '../../config';

/**
 * MySQL Provider Module
 * Configures TypeORM with MySQL database connection
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [MysqlProviderService],
  exports: [MysqlProviderService],
})
export class MysqlProviderModule {}
