import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { CourseController } from './controller/course.controller';
import { CourseSectionController } from './controller/course-section.controller';
import { InstructorController } from './controller/instructor.controller';
import { ClassScheduleController } from './controller/class-schedule.controller';
import { CourseService } from './service/course.service';
import { CourseSectionService } from './service/course-section.service';
import { InstructorService } from './service/instructor.service';
import { ClassScheduleService } from './service/class-schedule.service';
import { courseProviders } from './course.provider';
import { CourseSectionRepository } from './repository/course-section.repository';

@Module({
  imports: [MysqlProviderModule],
  controllers: [CourseController, CourseSectionController, InstructorController, ClassScheduleController],
  providers: [...courseProviders, CourseService, CourseSectionService, InstructorService, ClassScheduleService],
  exports: [CourseService, CourseSectionService, InstructorService, ClassScheduleService, CourseSectionRepository],
})
export class CourseModule {}

