import { Injectable } from '@nestjs/common';
import { Course } from '../entities/course.entity';
import { CourseRepository } from '../repository/course.repository';
import { CreateCourseDto } from '../dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
  ) {}

  /**
   * Create a new course
   * @param createCourseDto - Course data to create
   * @returns Created course
   */
  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create({
      courseId: createCourseDto.courseId,
      code: createCourseDto.code,
      name: createCourseDto.name,
      credits: createCourseDto.credits,
    });

    return await this.courseRepository.save(course);
  }

  /**
   * Find all courses
   * @returns List of courses
   */
  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find();
  }

  /**
   * Find course by ID
   * @param courseId - Course ID
   * @returns Course or null
   */
  async findOne(courseId: number): Promise<Course | null> {
    return await this.courseRepository.findOne({
      where: { courseId },
      relations: ['sections'],
    });
  }
}

