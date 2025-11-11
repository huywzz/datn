import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MysqlProviderModule } from 'src/provider';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { JwtStrategyService } from './service/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt.guard';
import { userProviders } from '../user/user.provider';

@Module({
  imports: [
    MysqlProviderModule,
    ConfigModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [...userProviders, AuthService, JwtStrategyService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtStrategyService],
})
export class AuthModule {}

