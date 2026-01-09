import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MysqlProviderModule } from 'src/provider';
import { RegistrationController } from './controller/registration.controller';
import { ExchangeRequestController } from './controller/exchange-request.controller';
import { ExchangeTransactionController } from './controller/exchange-transaction.controller';
import { RegistrationService } from './service/registration.service';
import { ExchangeRequestService } from './service/exchange-request.service';
import { ExchangeTransactionService } from './service/exchange-transaction.service';
import { ExchangeQueueService } from './service/exchange-queue.service';
import { ExchangeProcessorService } from './service/exchange-processor.service';
import { registrationProviders } from './registration.provider';
import { CourseModule } from '../course/course.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CohortModule } from '../cohort/cohort.module';
import { RegistrationValidationService } from './service/registration-validation.service';
import { ExchangeValidationService } from './service/exchange-validation.service';
import { SyncRegistrationService } from './service/sync-registration.service';

@Module({
  imports: [
    MysqlProviderModule,
    CourseModule,
    AuthModule,
    UserModule,
    CohortModule,
    ConfigModule,
  ],
  controllers: [RegistrationController, ExchangeRequestController, ExchangeTransactionController],
  providers: [
    RegistrationService,
    RegistrationValidationService,
    ExchangeValidationService,
    ExchangeRequestService,
    ExchangeTransactionService,
    ExchangeQueueService,
    ExchangeProcessorService,
    SyncRegistrationService,
    ...registrationProviders,
  ],
  exports: [
    RegistrationService,
    ExchangeRequestService,
    ExchangeTransactionService,
    ExchangeValidationService,
    ExchangeQueueService,
    ExchangeProcessorService,
    SyncRegistrationService,
  ],
})
export class RegistrationModule {}

