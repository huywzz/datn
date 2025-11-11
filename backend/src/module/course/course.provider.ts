import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseSection } from './entities/course-section.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { Instructor } from './entities/instructor.entity';
import { CourseRepository } from './repository/course.repository';
import { CourseSectionRepository } from './repository/course-section.repository';
import { ClassScheduleRepository } from './repository/class-schedule.repository';
import { InstructorRepository } from './repository/instructor.repository';
import {
  COURSE_REPOSITORY,
  COURSE_SECTION_REPOSITORY,
  CLASS_SCHEDULE_REPOSITORY,
  INSTRUCTOR_REPOSITORY,
} from 'src/common/constant/repository';

export const courseProviders = [
  {
    provide: COURSE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Course).extend(CourseRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: COURSE_SECTION_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CourseSection).extend(CourseSectionRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: CLASS_SCHEDULE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ClassSchedule).extend(ClassScheduleRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: INSTRUCTOR_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Instructor).extend(InstructorRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository classes directly for service injection
  {
    provide: ClassScheduleRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ClassSchedule).extend(ClassScheduleRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: CourseRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Course).extend(CourseRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: CourseSectionRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CourseSection).extend(CourseSectionRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: InstructorRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Instructor).extend(InstructorRepository),
    inject: [getDataSourceToken()],
  },
];

