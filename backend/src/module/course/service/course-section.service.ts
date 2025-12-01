import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CourseSection } from '../entities/course-section.entity';
import { CourseSectionRepository } from '../repository/course-section.repository';
import { CreateCourseSectionDto, CourseSectionImportRowDto } from '../dto/course-section.dto';
import { CourseService } from './course.service';
import { InstructorService } from './instructor.service';
import { ClassScheduleService } from './class-schedule.service';
import { ClassScheduleRepository } from '../repository/class-schedule.repository';
import { TemporaryService } from '../../temporary/service/temporary.service';
import { TemporaryRepository } from '../../temporary/repository/temporary.repository';
import * as XLSX from 'xlsx';
import { BaseException } from 'src/common/exceptions';
import { SearchCourseSectionDto, QueryCourseSectionByCourseIdDto, QueryStudentsBySectionDto } from '../dto/query-course-section.dto';
import { DayOfWeek, UserRole, CourseSectionStatus } from 'src/common/constant/enum';
import { Registration } from '../../registration/entities/registration.entity';
import { User } from '../../user/entities/user.entity';

interface ExcelRow {
  'Section code': string;
  course: string;
  'instructor name': string;
  'max student': number;
  'day of week': number;
  'start period': number;
  'end period': number;
  room?: string;
  [key: string]: unknown;
}

@Injectable()
export class CourseSectionService {
  constructor(
    private readonly courseSectionRepository: CourseSectionRepository,
    private readonly courseService: CourseService,
    private readonly instructorService: InstructorService,
    private readonly classScheduleService: ClassScheduleService,
    private readonly classScheduleRepository: ClassScheduleRepository,
    private readonly temporaryService: TemporaryService,
    private readonly temporaryRepository: TemporaryRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

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
   * Find course sections by course ID with pagination and optional semester filter
   * @param courseId - Course ID
   * @param queryDto - Pagination and filter query parameters
   * @param user - Current user (for role-based filtering)
   * @returns Paginated list of course sections for the specified course
   */
  async findByCourseId(
    courseId: number,
    queryDto: QueryCourseSectionByCourseIdDto,
    user: User,
  ): Promise<{
    data: CourseSection[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const queryBuilder = this.courseSectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.course', 'course')
      .leftJoinAndSelect('section.instructor', 'instructor')
      .leftJoinAndSelect('section.classSchedules', 'classSchedules')
      .where('section.courseId = :courseId', { courseId });

    // Filter by status based on user role
    // Student: only show sections with status 'open' or 'full'
    // Admin: show all sections (no status filter)
    if (user.role === UserRole.STUDENT) {
      queryBuilder.andWhere('section.status IN (:...statuses)', {
        statuses: [CourseSectionStatus.OPEN, CourseSectionStatus.FULL],
      });
    }

    // Search by section code, course name, or instructor name
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(section.sectionCode LIKE :search OR course.name LIKE :search OR instructor.fullName LIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Filter by semester ID
    if (queryDto.semesterId) {
      queryBuilder.andWhere('section.semesterId = :semesterId', { semesterId: queryDto.semesterId });
    }

    // Apply sorting
    if (queryDto.sortBy) {
      const sortOrder = queryDto.sortOrder || 'DESC';
      // Validate sortBy field to prevent SQL injection
      const allowedSortFields = [
        'section.sectionId',
        'section.sectionCode',
        'section.createdAt',
        'section.updatedAt',
        'course.courseName',
        'instructor.fullName',
      ];

      if (allowedSortFields.includes(queryDto.sortBy)) {
        queryBuilder.orderBy(queryDto.sortBy, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('section.createdAt', 'DESC');
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('section.createdAt', 'DESC');
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
   * Convert day of week number to Vietnamese text
   * @param dayOfWeek - Day of week number (1-6)
   * @returns Vietnamese day text (Thứ 2, Thứ 3, ..., Thứ 7)
   */
  private formatDayOfWeek(dayOfWeek: number): string {
    const dayMap: Record<number, string> = {
      [DayOfWeek.MONDAY]: 'Thứ 2',
      [DayOfWeek.TUESDAY]: 'Thứ 3',
      [DayOfWeek.WEDNESDAY]: 'Thứ 4',
      [DayOfWeek.THURSDAY]: 'Thứ 5',
      [DayOfWeek.FRIDAY]: 'Thứ 6',
      [DayOfWeek.SATURDAY]: 'Thứ 7',
    };
    return dayMap[dayOfWeek] || `Thứ ${dayOfWeek + 1}`;
  }

  /**
   * Generate schedule string from class schedules
   * @param schedules - Array of class schedules
   * @returns Formatted schedule string
   */
  private generateScheduleString(schedules: Array<{ dayOfWeek: string; startPeriod: number; endPeriod: number; room?: string }>): string {
    // Sort schedules by dayOfWeek (convert to number for sorting)
    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayA = parseInt(a.dayOfWeek, 10) || 0;
      const dayB = parseInt(b.dayOfWeek, 10) || 0;
      return dayA - dayB;
    });

    return sortedSchedules
      .map((schedule) => {
        const dayOfWeekNum = parseInt(schedule.dayOfWeek, 10);
        const dayText = this.formatDayOfWeek(dayOfWeekNum);
        const periodText = `Tiết ${schedule.startPeriod}-${schedule.endPeriod}`;
        const roomText = schedule.room ? ` - ${schedule.room}` : '';
        return `${dayText} (${periodText})${roomText}`;
      })
      .join('; ');
  }

  /**
   * Import course sections from Excel file
   * @param file - Excel file buffer
   * @param semesterId - Semester ID
   * @param cohortId - Cohort ID for temporary records
   * @returns Object with success count and errors
   */
  async importFromExcel(file: Express.Multer.File, semesterId: number, cohortId: string): Promise<{ success: number; errors: string[] }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const errors: string[] = [];
    let successCount = 0;
    const sectionCache = new Map<string, CourseSection>();
    const processedCourses = new Set<number>(); // Track courses already added to temporary

    try {
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

        try {
          const { data: parsedRow, errors: rowErrors } = CourseSectionImportRowDto.fromExcelRow(row);
          if (!parsedRow) {
            rowErrors.forEach((message) => errors.push(`Row ${rowNumber}: ${message}`));
            continue;
          }

          // Find course by name
          const course = await this.courseService.findByName(parsedRow.courseName);
          if (!course) {
            errors.push(`Row ${rowNumber}: Course "${parsedRow.courseName}" not found`);
            continue;
          }

          // Find instructor by full name
          const instructor = await this.instructorService.findByFullName(parsedRow.instructorName);
          if (!instructor) {
            errors.push(`Row ${rowNumber}: Instructor "${parsedRow.instructorName}" not found`);
            continue;
          }

          const sectionCacheKey = `${semesterId}:${course.courseId}:${instructor.instructorId}:${parsedRow.sectionCode}`;

          let section = sectionCache.get(sectionCacheKey);

          if (!section) {
            const existingSection = await this.courseSectionRepository.findOne({
              where: {
                sectionCode: parsedRow.sectionCode,
                courseId: course.courseId,
                instructorId: instructor.instructorId,
                semesterId,
              },
            });

            if (existingSection) {
              section = existingSection;
              if (section.maxStudents !== parsedRow.maxStudents) {
                await this.courseSectionRepository.update(section.sectionId, {
                  maxStudents: parsedRow.maxStudents,
                });
                section.maxStudents = parsedRow.maxStudents;
              }
            } else {
              section = this.courseSectionRepository.create({
                sectionCode: parsedRow.sectionCode,
                courseId: course.courseId,
                instructorId: instructor.instructorId,
                maxStudents: parsedRow.maxStudents,
                semesterId,
                status: 'open',
              });

              section = await this.courseSectionRepository.save(section);
            }

            sectionCache.set(sectionCacheKey, section);
          } else if (section.maxStudents !== parsedRow.maxStudents) {
            await this.courseSectionRepository.update(section.sectionId, {
              maxStudents: parsedRow.maxStudents,
            });
            section.maxStudents = parsedRow.maxStudents;
          }

          if (!section) {
            throw new BaseException(`Unable to create course section for row ${rowNumber}`);
          }

          // Create class schedule (allow multiple schedules per section)
          const foundClassSchedule = await this.classScheduleRepository.findOne({
            where: {
              sectionId: section.sectionId,
              dayOfWeek: `${parsedRow.dayOfWeek}`,
              startPeriod: parsedRow.startPeriod,
              endPeriod: parsedRow.endPeriod,
              // room: parsedRow.room,
            }
          })
          if (foundClassSchedule) {
            throw new BaseException(`Class schedule already exists for row ${rowNumber}`);
          }
          await this.classScheduleService.create({
            sectionId: section.sectionId,
            dayOfWeek: `${parsedRow.dayOfWeek}`,
            startPeriod: parsedRow.startPeriod,
            endPeriod: parsedRow.endPeriod,
            room: parsedRow.room,
          });

          // Add course to temporary if not already processed
          if (!processedCourses.has(course.courseId)) {
            try {
              // Check if temporary record already exists
              const existingTemporary = await this.temporaryRepository.findOne({
                where: {
                  courseId: course.courseId,
                  cohortId,
                },
              });

              if (!existingTemporary) {
                await this.temporaryService.create({
                  courseId: course.courseId,
                  cohortId,
                  status: 'active',
                });
              }
              processedCourses.add(course.courseId);
            } catch (error) {
              errors.push(`Row ${rowNumber}: Failed to add course to temporary: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          successCount++;
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof BaseException ? error.message : 'Unknown error'}`);
        }
      }

      // Update schedule field for all sections
      for (const section of sectionCache.values()) {
        try {
          const schedules = await this.classScheduleRepository.find({
            where: { sectionId: section.sectionId },
            order: { dayOfWeek: 'ASC', startPeriod: 'ASC' },
          });

          if (schedules.length > 0) {
            const scheduleString = this.generateScheduleString(schedules);
            await this.courseSectionRepository.update(section.sectionId, {
              schedule: scheduleString,
            });
          }
        } catch (error) {
          errors.push(`Failed to update schedule for section ${section.sectionCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: successCount, errors };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  

  /**
   * Get all students registered in a specific course section with pagination and search
   * @param sectionId - Section ID
   * @param queryDto - Pagination and search query parameters
   * @returns Paginated list of students with registration details
   */
  async getStudentsBySection(
    sectionId: number,
    queryDto: QueryStudentsBySectionDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    // Check if section exists
    const section = await this.courseSectionRepository.findOne({
      where: { sectionId },
    });

    if (!section) {
      throw new BadRequestException(`Course section with ID ${sectionId} not found`);
    }

    const registrationRepository = this.dataSource.getRepository(Registration);
    const queryBuilder = registrationRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('registration.sectionId = :sectionId', { sectionId })
      .andWhere('registration.status = :status', { status: 'active' });

    // Search by student name, student code, class code, or major
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(student.fullName LIKE :search OR student.studentCode LIKE :search OR student.classCode LIKE :search OR student.major LIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Apply sorting
    if (queryDto.sortBy) {
      const sortOrder = queryDto.sortOrder || 'DESC';
      // Validate sortBy field to prevent SQL injection
      const allowedSortFields = [
        'student.studentCode',
        'student.fullName',
        'student.classCode',
        'student.major',
        'registration.registeredAt',
        'registration.registrationId',
      ];

      if (allowedSortFields.includes(queryDto.sortBy)) {
        queryBuilder.orderBy(queryDto.sortBy, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('registration.registeredAt', 'DESC');
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('registration.registeredAt', 'DESC');
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = queryDto.getSkip();

    queryBuilder.skip(skip).take(queryDto.getTake());

    const registrations = await queryBuilder.getMany();

    // Map to student data format
    const data = registrations.map((reg) => ({
      studentId: reg.student.id,
      studentCode: reg.student.studentCode,
      fullName: reg.student.fullName,
      classCode: reg.student.classCode,
      major: reg.student.major,
      yearOfStudy: reg.student.yearOfStudy,
      registrationId: reg.registrationId,
      registeredAt: reg.registeredAt,
      semester: reg.semester,
    }));

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
   * Search and filter course sections with pagination
   * @param searchDto - Search and filter parameters
   * @returns Paginated list of filtered course sections
   */
  async searchCourseSections(searchDto: SearchCourseSectionDto): Promise<{
    data: CourseSection[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const queryBuilder = this.courseSectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.course', 'course')
      .leftJoinAndSelect('section.instructor', 'instructor')
      .leftJoinAndSelect('section.semester', 'semester')
      .leftJoinAndSelect('section.classSchedules', 'classSchedules');

    // Search by section code, course name, or instructor name
    if (searchDto.search) {
      queryBuilder.andWhere(
        '(section.sectionCode LIKE :search OR course.courseName LIKE :search OR instructor.fullName LIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    // Filter by course ID
    if (searchDto.courseId) {
      queryBuilder.andWhere('section.courseId = :courseId', { courseId: searchDto.courseId });
    }

    // Filter by instructor ID
    if (searchDto.instructorId) {
      queryBuilder.andWhere('section.instructorId = :instructorId', { instructorId: searchDto.instructorId });
    }

    // Filter by status
    if (searchDto.status) {
      queryBuilder.andWhere('section.status = :status', { status: searchDto.status });
    }

    // Filter by semester ID
    if (searchDto.semesterId) {
      queryBuilder.andWhere('section.semesterId = :semesterId', { semesterId: searchDto.semesterId });
    }

    // Apply sorting
    if (searchDto.sortBy) {
      const sortOrder = searchDto.sortOrder || 'DESC';
      // Validate sortBy field to prevent SQL injection
      const allowedSortFields = [
        'section.sectionId',
        'section.sectionCode',
        'section.createdAt',
        'section.updatedAt',
        'course.courseName',
        'instructor.fullName',
      ];
      
      if (allowedSortFields.includes(searchDto.sortBy)) {
        queryBuilder.orderBy(searchDto.sortBy, sortOrder);
      } else {
        // Default sorting
        queryBuilder.orderBy('section.createdAt', 'DESC');
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('section.createdAt', 'DESC');
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 10;
    const skip = searchDto.getSkip();
    
    queryBuilder.skip(skip).take(searchDto.getTake());

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
   * Find all course sections by semester ID
   * @param semesterId - Semester ID
   * @returns List of course sections for the specified semester
   */
  async findBySemesterId(semesterId: number): Promise<CourseSection[]> {
    return await this.courseSectionRepository.find({
      where: { semesterId },
      relations: ['course', 'instructor', 'classSchedules', 'semester'],
    });
  }
}

