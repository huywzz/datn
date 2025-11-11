import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClassSchedule } from '../entities/class-schedule.entity';
import { CLASS_SCHEDULE_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class ClassScheduleRepository extends Repository<ClassSchedule> {
  constructor(@Inject(CLASS_SCHEDULE_REPOSITORY) private classScheduleRepository: Repository<ClassSchedule>) {
    super(classScheduleRepository.target, classScheduleRepository.manager, classScheduleRepository.queryRunner);
  }
}

