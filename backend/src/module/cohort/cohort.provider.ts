import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Cohort } from './entities/cohort.entity';
import { CohortRepository } from './repository/cohort.repository';
import {
  COURSE_REGISTRATION_PERIOD_REPOSITORY,
  COHORT_REPOSITORY,
} from 'src/common/constant/repository';
import { CourseRegistrationPeriod } from './entities/course-registration-period.entity';
import { CourseRegistrationPeriodRepository } from './repository/course-registration-period.repository';

export const cohortProviders = [
  {
    provide: COHORT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Cohort).extend(CohortRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository class directly for service injection
  {
    provide: CohortRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Cohort).extend(CohortRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: COURSE_REGISTRATION_PERIOD_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CourseRegistrationPeriod).extend(CourseRegistrationPeriodRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: CourseRegistrationPeriodRepository,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CourseRegistrationPeriod).extend(CourseRegistrationPeriodRepository),
    inject: [getDataSourceToken()],
  },
];

