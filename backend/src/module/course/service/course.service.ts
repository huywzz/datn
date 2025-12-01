import { Injectable } from '@nestjs/common';
import { Course } from '../entities/course.entity';
import { CourseRepository } from '../repository/course.repository';
import { CreateCourseDto } from '../dto/course.dto';
import { QueryCourseDto } from '../dto/course.dto';

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
   * Find all courses with pagination and search
   * @param queryDto - Pagination and search query parameters
   * @returns Paginated list of courses
   */
  async findAll(queryDto: QueryCourseDto): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course');

    // Search by course code or name
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(course.code LIKE :search OR course.name LIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Apply sorting
    if (queryDto.sortBy) {
      const sortOrder = queryDto.sortOrder || 'DESC';
      // Validate sortBy field to prevent SQL injection
      const allowedSortFields = [
        'course.courseId',
        'course.code',
        'course.name',
        'course.credits',
        'course.createdAt',
        'course.updatedAt',
      ];

      if (allowedSortFields.includes(queryDto.sortBy)) {
        queryBuilder.orderBy(queryDto.sortBy, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('course.createdAt', 'DESC');
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('course.createdAt', 'DESC');
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = queryDto.getSkip();

    queryBuilder.skip(skip).take(queryDto.getTake());

    const data = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasPrevious,
      hasNext,
    };
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

  /**
   * Find course by name
   * @param name - Course name
   * @returns Course or null
   */
  async findByName(name: string): Promise<Course | null> {
    return await this.courseRepository.findOne({
      where: { name },
    });
  }
}

