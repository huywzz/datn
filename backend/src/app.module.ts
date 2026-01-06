import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './module/user/user.module';
import { CourseModule } from './module/course/course.module';
import { RegistrationModule } from './module/registration/registration.module';
import { TemporaryModule } from './module/temporary/temporary.module';
import { CohortModule } from './module/cohort/cohort.module';
import { SemesterModule } from './module/semester/semester.module';
import { AuthModule } from './module/auth/auth.module';
import { ProviderModule } from './provider/provider.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ProviderModule,
    UserModule,
    AuthModule,
    CourseModule,
    RegistrationModule,
    TemporaryModule,
    CohortModule,
    SemesterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
