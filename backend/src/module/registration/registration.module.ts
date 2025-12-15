import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { RegistrationController } from './controller/registration.controller';
import { ExchangeRequestController } from './controller/exchange-request.controller';
import { RegistrationService } from './service/registration.service';
import { ExchangeRequestService } from './service/exchange-request.service';
import { registrationProviders } from './registration.provider';
import { CourseModule } from '../course/course.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CohortModule } from '../cohort/cohort.module';
import { RegistrationValidationService } from './service/registration-validation.service';

@Module({
  imports: [MysqlProviderModule, CourseModule, AuthModule, UserModule, CohortModule],
  controllers: [RegistrationController, ExchangeRequestController],
  providers: [
    RegistrationService,
    RegistrationValidationService,
    ExchangeRequestService,
    ...registrationProviders,
  ],
  exports: [RegistrationService, ExchangeRequestService],
})
export class RegistrationModule {}

