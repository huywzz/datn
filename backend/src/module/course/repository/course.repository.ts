import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { COURSE_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class CourseRepository extends Repository<Course> {
  constructor(@Inject(COURSE_REPOSITORY) private courseRepository: Repository<Course>) {
    super(courseRepository.target, courseRepository.manager, courseRepository.queryRunner);
  }
}

