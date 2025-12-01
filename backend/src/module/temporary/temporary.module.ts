import { forwardRef, Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { TemporaryController } from './controller/temporary.controller';
import { TemporaryService } from './service/temporary.service';
import { temporaryProviders } from './temporary.provider';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CourseModule } from '../course/course.module';
import { CohortModule } from '../cohort/cohort.module';
import { TemporaryRepository } from './repository/temporary.repository';

@Module({
  imports: [MysqlProviderModule, AuthModule, UserModule, forwardRef(() => CourseModule), CohortModule],
  controllers: [TemporaryController],
  providers: [...temporaryProviders, TemporaryService],
  exports: [TemporaryService, TemporaryRepository],
})
export class TemporaryModule { }

