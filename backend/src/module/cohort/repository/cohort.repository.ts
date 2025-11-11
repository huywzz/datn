import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cohort } from '../entities/cohort.entity';
import { COHORT_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class CohortRepository extends Repository<Cohort> {
  constructor(@Inject(COHORT_REPOSITORY) private cohortRepository: Repository<Cohort>) {
    super(cohortRepository.target, cohortRepository.manager, cohortRepository.queryRunner);
  }
}

