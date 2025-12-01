import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { CohortController } from './controllers/cohort.controller';
import { CohortService } from './services/cohort.service';
import { cohortProviders } from './cohort.provider';
import { CourseRegistrationPeriodService } from './services/course-registration-period.service';
import { CourseRegistrationPeriodController } from './controllers/course-registration-period.controller';
import { CohortRepository } from './repository/cohort.repository';
import { CourseRegistrationPeriodRepository } from './repository/course-registration-period.repository';

@Module({
  imports: [MysqlProviderModule],
  controllers: [CohortController, CourseRegistrationPeriodController],
  providers: [...cohortProviders, CohortService, CourseRegistrationPeriodService],
  exports: [CohortService, CourseRegistrationPeriodService, CohortRepository, CourseRegistrationPeriodRepository],
})
export class CohortModule { }

