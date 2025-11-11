import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Instructor } from '../entities/instructor.entity';
import { INSTRUCTOR_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class InstructorRepository extends Repository<Instructor> {
  constructor(@Inject(INSTRUCTOR_REPOSITORY) private instructorRepository: Repository<Instructor>) {
    super(instructorRepository.target, instructorRepository.manager, instructorRepository.queryRunner);
  }
}

