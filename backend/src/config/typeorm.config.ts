import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbLogLevel = process.env.DB_LOG_LEVEL || 'error,query';
  const logLevels = dbLogLevel.split(',').map((level) => level.trim());

  // Convert log levels to TypeORM logging format
  const logging: (
    | 'query'
    | 'error'
    | 'warn'
    | 'info'
    | 'log'
    | 'schema'
    | 'migration'
  )[] = [];

  if (logLevels.includes('query')) {
    logging.push('query');
  }
  if (logLevels.includes('error')) {
    logging.push('error');
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: logging.length > 0 ? logging : false,
    timezone: 'Z',
    charset: 'utf8mb4',
    extra: {
      charset: 'utf8mb4_unicode_ci',
    },
    poolSize: configService.get<number>('DB_POOL_SIZE', 10),
  };
};

/**
 * Default TypeORM configuration for development
 */
export const defaultTypeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'defect_management',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['error', 'query'], // Enable error and query logging by default
  timezone: 'Z',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
};
