import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CourseSection } from '../entities/course-section.entity';
import { COURSE_SECTION_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class CourseSectionRepository extends Repository<CourseSection> {
  constructor(@Inject(COURSE_SECTION_REPOSITORY) private courseSectionRepository: Repository<CourseSection>) {
    super(courseSectionRepository.target, courseSectionRepository.manager, courseSectionRepository.queryRunner);
  }
}

