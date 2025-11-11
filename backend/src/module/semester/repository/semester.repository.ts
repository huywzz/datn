import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Semester } from '../entities/semester.entity';
import { SEMESTER_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class SemesterRepository extends Repository<Semester> {
  constructor(@Inject(SEMESTER_REPOSITORY) private semesterRepository: Repository<Semester>) {
    super(semesterRepository.target, semesterRepository.manager, semesterRepository.queryRunner);
  }
}


