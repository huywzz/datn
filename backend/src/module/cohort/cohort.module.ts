import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { CohortController } from './controllers/cohort.controller';
import { CohortService } from './services/cohort.service';
import { cohortProviders } from './cohort.provider';

@Module({
  imports: [MysqlProviderModule],
  controllers: [CohortController],
  providers: [...cohortProviders, CohortService],
  exports: [CohortService],
})
export class CohortModule {}

