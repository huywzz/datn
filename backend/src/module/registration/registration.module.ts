import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { RegistrationController } from './controller/registration.controller';
import { ExchangeRequestController } from './controller/exchange-request.controller';
import { ExchangeTransactionController } from './controller/exchange-transaction.controller';
import { RegistrationService } from './service/registration.service';
import { ExchangeRequestService } from './service/exchange-request.service';
import { ExchangeTransactionService } from './service/exchange-transaction.service';
import { registrationProviders } from './registration.provider';
import { CourseModule } from '../course/course.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CohortModule } from '../cohort/cohort.module';
import { RegistrationValidationService } from './service/registration-validation.service';

@Module({
  imports: [MysqlProviderModule, CourseModule, AuthModule, UserModule, CohortModule],
  controllers: [RegistrationController, ExchangeRequestController, ExchangeTransactionController],
  providers: [
    RegistrationService,
    RegistrationValidationService,
    ExchangeRequestService,
    ExchangeTransactionService,
    ...registrationProviders,
  ],
  exports: [RegistrationService, ExchangeRequestService, ExchangeTransactionService],
})
export class RegistrationModule {}

