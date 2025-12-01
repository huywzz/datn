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
import { CourseRepository } from './repository/course.repository';
import { TemporaryModule } from '../temporary/temporary.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MysqlProviderModule, TemporaryModule, UserModule, AuthModule],
  controllers: [CourseController, CourseSectionController, InstructorController, ClassScheduleController],
  providers: [...courseProviders, CourseService, CourseSectionService, InstructorService, ClassScheduleService],
  exports: [CourseService, CourseSectionService, InstructorService, ClassScheduleService, CourseSectionRepository, CourseRepository],
})
export class CourseModule { }

