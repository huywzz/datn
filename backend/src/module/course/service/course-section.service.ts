import { Injectable } from '@nestjs/common';
import { CourseSection } from '../entities/course-section.entity';
import { CourseSectionRepository } from '../repository/course-section.repository';
import { CreateCourseSectionDto } from '../dto/course-section.dto';

@Injectable()
export class CourseSectionService {
  constructor(
    private readonly courseSectionRepository: CourseSectionRepository,
  ) {}

  /**
   * Create a new course section
   * @param createCourseSectionDto - Course section data to create
   * @returns Created course section
   */
  async create(createCourseSectionDto: CreateCourseSectionDto): Promise<CourseSection> {
    const section = this.courseSectionRepository.create({
      sectionCode: createCourseSectionDto.sectionCode,
      courseId: createCourseSectionDto.courseId,
      instructorId: createCourseSectionDto.instructorId,
      maxStudents: createCourseSectionDto.maxStudents,
      schedule: createCourseSectionDto.schedule,
      status: createCourseSectionDto.status || 'open',
    });

    return await this.courseSectionRepository.save(section);
  }

  /**
   * Find all course sections
   * @returns List of course sections
   */
  async findAll(): Promise<CourseSection[]> {
    return await this.courseSectionRepository.find({
      relations: ['course', 'instructor', 'classSchedules'],
    });
  }

  /**
   * Find course section by ID
   * @param sectionId - Section ID
   * @returns Course section or null
   */
  async findOne(sectionId: number): Promise<CourseSection | null> {
    return await this.courseSectionRepository.findOne({
      where: { sectionId },
      relations: ['course', 'instructor', 'classSchedules', 'registrations'],
    });
  }

  /**
   * Find course sections by course ID
   * @param courseId - Course ID
   * @returns List of course sections for the specified course
   */
  async findByCourseId(courseId: number): Promise<CourseSection[]> {
    return await this.courseSectionRepository.find({
      where: { courseId },
      relations: ['course', 'instructor', 'classSchedules'],
    });
  }
}

