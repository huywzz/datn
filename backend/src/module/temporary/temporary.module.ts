import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { TemporaryController } from './controller/temporary.controller';
import { TemporaryService } from './service/temporary.service';
import { temporaryProviders } from './temporary.provider';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MysqlProviderModule, AuthModule, UserModule],
  controllers: [TemporaryController],
  providers: [...temporaryProviders, TemporaryService],
  exports: [TemporaryService],
})
export class TemporaryModule {}

