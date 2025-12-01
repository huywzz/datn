import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CourseRegistrationPeriod } from '../entities/course-registration-period.entity';
import { COURSE_REGISTRATION_PERIOD_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class CourseRegistrationPeriodRepository extends Repository<CourseRegistrationPeriod> {
  constructor(
    @Inject(COURSE_REGISTRATION_PERIOD_REPOSITORY)
    private readonly courseRegistrationPeriodRepository: Repository<CourseRegistrationPeriod>,
  ) {
    super(
      courseRegistrationPeriodRepository.target,
      courseRegistrationPeriodRepository.manager,
      courseRegistrationPeriodRepository.queryRunner,
    );
  }
}

