import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Cohort } from './entities/cohort.entity';
import { CohortRepository } from './repository/cohort.repository';
import { COHORT_REPOSITORY } from 'src/common/constant/repository';

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
];

