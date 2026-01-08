import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Registration } from '../entities/registration.entity';
import { RegistrationRepository } from '../repository/registration.repository';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { User } from 'src/module/user/entities/user.entity';
import { StudentRepository } from 'src/module/user/repository/student.repository';
import { CourseSection } from 'src/module/course/entities/course-section.entity';
import { CourseRegistrationPeriodRepository } from 'src/module/cohort/repository/course-registration-period.repository';
import { RegistrationValidationService } from './registration-validation.service';
import { RedisProviderService } from '../../../provider/redis/redis-provider.service';
import { CourseSectionService } from 'src/module/course/service/course-section.service';
import Redis from 'ioredis';

@Injectable()
export class RegistrationService {
  private readonly redis: Redis;

  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly courseSectionRepository: CourseSectionRepository,
    // private readonly userService: UserService,
    private readonly studentRepository: StudentRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly registrationValidationService: RegistrationValidationService,
    private readonly courseSectionService: CourseSectionService,
    private readonly configService: ConfigService,
    redisService: RedisProviderService,
  ) {
    this.redis = redisService.getClient();
  }

  /**
   * Tạo key hash lưu các môn học mà sinh viên đã đăng ký trong một học kỳ
   * Hash này đóng vai trò như hashMap: courseId -> CourseSection
   */
  private getCourseHashKey(studentId: number, semesterId: number): string {
    return `registration:student:${studentId}:semester:${semesterId}:courses`;
  }

  /**
   * Create a new registration
   * @param createRegistrationDto - Registration data to create
   * @returns Created registration
   */
  async create(createRegistrationDto: CreateRegistrationDto, user: User) {
    let foundStudent;

    if (user.role === 'admin') {
      if (!createRegistrationDto.studentId) {
        throw new BadRequestException('Vui lòng cung cấp ID sinh viên!');
      }
      foundStudent = await this.studentRepository.findOne({
        where: { id: createRegistrationDto.studentId },
      });
    } else {
      foundStudent = await this.studentRepository.findOne({
        where: { userId: user.userId },
      });
    }

    if (!foundStudent) {
      throw new BadRequestException('Sinh viên không tồn tại!');
    }

    // Validate tất cả điều kiện đăng ký
    const foundCourseSection =
      await this.registrationValidationService.validateRegistration(
        foundStudent.id,
        foundStudent.currentSemester,
        createRegistrationDto.sectionId,
      );

    // Lưu hashMap courseId -> courseSection vào Redis cho sinh viên trong học kỳ hiện tại
    const hashKey = this.getCourseHashKey(foundStudent.id, foundStudent.currentSemester);
    await this.redis.hset(
      hashKey,
      foundCourseSection.courseId.toString(),
      JSON.stringify(foundCourseSection),
    );

    // Thêm studentId vào Redis set để đếm số lượng sinh viên đã đăng ký
    const setKey = `course-section:registered:students:${foundCourseSection.sectionId}`;
    await this.redis.sadd(setKey, foundStudent.id.toString());

    return [];

    // Thực hiện transaction: tạo registration và tăng currentStudents
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // Kiểm tra lại currentStudents trong transaction với pessimistic lock để tránh race condition
      const sectionInTransaction = await manager
        .createQueryBuilder(CourseSection, 'section')
        .setLock('pessimistic_write')
        .where('section.sectionId = :sectionId', {
          sectionId: foundCourseSection.sectionId,
        })
        .getOne();

      if (!sectionInTransaction) {
        throw new BadRequestException('Lớp học phần không tồn tại!');
      }

      if (sectionInTransaction.currentStudents >= sectionInTransaction.maxStudents) {
        throw new BadRequestException('Lớp học phần đã đầy!');
      }

      // Tạo registration mới
      const newRegistration = manager.create(Registration, {
        studentId: foundStudent.id,
        sectionId: foundCourseSection.sectionId,
        registeredAt: new Date(),
        status: 'active',
        semester: foundStudent.currentSemester,
      });

      const savedRegistration = await manager.save(Registration, newRegistration);

      // Tăng currentStudents của section
      await manager.update(
        CourseSection,
        { sectionId: foundCourseSection.sectionId },
        { currentStudents: sectionInTransaction.currentStudents + 1 },
      );

      // Lưu hashMap courseId -> courseSection vào Redis cho sinh viên trong học kỳ hiện tại
      const hashKey = this.getCourseHashKey(foundStudent.id, foundStudent.currentSemester);
      await this.redis.hset(
        hashKey,
        foundCourseSection.courseId.toString(),
        JSON.stringify(foundCourseSection),
      );

      // Thêm studentId vào Redis set để đếm số lượng sinh viên đã đăng ký
      const setKey = `course-section:registered:students:${foundCourseSection.sectionId}`;
      await this.redis.sadd(setKey, foundStudent.id.toString());

      // Load lại registration với relations để trả về đầy đủ thông tin
      return [];
      return await manager.findOne(Registration, {
        where: { registrationId: savedRegistration.registrationId },
        relations: ['student', 'section'],
      });
    });
  }

  /**
   * Find all registrations
   * @returns List of registrations
   */
  async findAll(): Promise<Registration[]> {
    return await this.registrationRepository.find({
      relations: ['student', 'section'],
    });
  }

  /**
   * Find registration by ID
   * @param registrationId - Registration ID
   * @returns Registration or null
   */
  async findOne(registrationId: number): Promise<Registration | null> {
    return await this.registrationRepository.findOne({
      where: { registrationId },
      relations: ['student', 'section'],
    });
  }

  /**
   * Get class schedule for current student
   * @param user - Current user
   * @returns List of class schedules with section information
   */
  async getMySchedule(user: User) {
    const foundStudent = await this.studentRepository.findOne({
      where: { userId: user.userId },
    });

    if (!foundStudent) {
      throw new BadRequestException('Sinh viên không tồn tại!');
    }

    // Lấy danh sách CourseSection đã đăng ký từ Redis cache
    const registeredSections = await this.courseSectionRepository.getStudentRegisteredSectionsFromCache(
      foundStudent.id,
      foundStudent.currentSemester,
    );

    // Nếu không có trong cache, fallback về query database
    if (!registeredSections || registeredSections.length === 0) {
      const registrations = await this.registrationRepository.find({
        where: {
          student: {
            userId: user.userId,
          },
          section: {
            semesterId: foundStudent.currentSemester,
          },
          status: 'active',
        },
        relations: {
          section: {
            classSchedules: true,
            course: true,
          },
        },
      });

      // Flatten và format lịch học với thông tin section
      const schedules = registrations
        .filter(reg => reg.section?.classSchedules && reg.section.classSchedules.length > 0)
        .flatMap(registration =>
          registration.section.classSchedules.map(schedule => ({
            registrationId: registration.registrationId,
            scheduleId: schedule.scheduleId,
            dayOfWeek: schedule.dayOfWeek,
            startPeriod: schedule.startPeriod,
            endPeriod: schedule.endPeriod,
            room: schedule.room,
            section: {
              sectionId: registration.section.sectionId,
              sectionCode: registration.section.sectionCode,
              courseId: registration.section.courseId,
              courseName: registration.section.course?.name || null,
              courseCode: registration.section.course?.code || null,
              instructorId: registration.section.instructorId,
            },
          })),
        );

      return {
        studentId: foundStudent.id,
        studentCode: foundStudent.studentCode,
        fullName: foundStudent.fullName,
        currentSemester: foundStudent.currentSemester,
        schedules,
      };
    }

    // Load thêm course relation nếu thiếu và đảm bảo có classSchedules
    const sectionsWithRelations = await Promise.all(
      registeredSections.map(async (section) => {
        // Nếu thiếu classSchedules hoặc course, load thêm từ DB
        if (!section.classSchedules || !section.course) {
          const fullSection = await this.courseSectionRepository.findOne({
            where: { sectionId: section.sectionId },
            relations: {
              classSchedules: true,
              course: true,
            },
          });
          return fullSection || section;
        }
        return section;
      }),
    );

    // Flatten và format lịch học với thông tin section từ Redis cache
    const schedules = sectionsWithRelations
      .filter((section): section is CourseSection => !!section)
      .filter(section => section.classSchedules && section.classSchedules.length > 0)
      .flatMap(section =>
        section.classSchedules.map(schedule => ({
          registrationId: null, // Không có registrationId từ cache
          scheduleId: schedule.scheduleId,
          dayOfWeek: schedule.dayOfWeek,
          startPeriod: schedule.startPeriod,
          endPeriod: schedule.endPeriod,
          room: schedule.room,
          section: {
            sectionId: section.sectionId,
            sectionCode: section.sectionCode,
            courseId: section.courseId,
            courseName: section.course?.name || null,
            courseCode: section.course?.code || null,
            instructorId: section.instructorId,
          },
        })),
      );

    return {
      studentId: foundStudent.id,
      studentCode: foundStudent.studentCode,
      fullName: foundStudent.fullName,
      currentSemester: foundStudent.currentSemester,
      schedules,
    };
  }



  /**
   * Cancel registration
   * @param registrationId - Registration ID (optional)
   * @param sectionId - Section ID (optional)
   * @param user - Current user requesting cancellation
   */
  async cancel(registrationId: number | undefined, sectionId: number | undefined, user: User): Promise<void> {
    let registration: Registration | null = null;

    // Tìm registration bằng registrationId hoặc sectionId
    if (registrationId) {
      registration = await this.registrationRepository.findOne({
        where: { registrationId },
        relations: ['student', 'section'],
      });
    } else if (sectionId) {
      // Tìm registration bằng sectionId và studentId
      const student = await this.studentRepository.findOne({
        where: { userId: user.userId },
      });

      if (!student) {
        throw new BadRequestException('Sinh viên không tồn tại!');
      }

      registration = await this.registrationRepository.findOne({
        where: {
          sectionId,
          studentId: student.id,
        },
        relations: ['student', 'section'],
      });
    }

    // Nếu chỉ có sectionId mà không tìm thấy registration, tạm thời xóa Redis trực tiếp
    if (!registration && sectionId) {
      const student = await this.studentRepository.findOne({
        where: { userId: user.userId },
      });

      if (!student) {
        throw new BadRequestException('Sinh viên không tồn tại!');
      }

      // Lấy thông tin section để có courseId
      const section = await this.courseSectionRepository.findOne({
        where: { sectionId },
        relations: ['course'],
      });

      if (section) {
        // Xoá courseSection tương ứng khỏi Redis hashMap courseId -> courseSection
        const hashKey = this.getCourseHashKey(student.id, student.currentSemester);
        await this.redis.hdel(hashKey, section.courseId.toString());
      }

      // Xóa studentId khỏi Redis set để cập nhật số lượng sinh viên đã đăng ký
      const setKey = `course-section:registered:students:${sectionId}`;
      await this.redis.srem(setKey, student.id.toString());

      return;
    }

    if (!registration) {
      throw new BadRequestException('Đăng ký không tồn tại!');
    }

    // Check permissions
    if (user.role !== 'admin') {
      // If not admin, must be the student who owns the registration
      const student = await this.studentRepository.findOne({
        where: { userId: user.userId },
      });

      if (!student || student.id !== registration.studentId) {
        throw new BadRequestException('Bạn không có quyền hủy đăng ký này!');
      }
    }

    // Xoá courseSection tương ứng khỏi Redis hashMap courseId -> courseSection
    // Hash key: registration:student:{studentId}:semester:{semesterId}:courses
    if (registration.section?.courseId) {
      const hashKey = this.getCourseHashKey(registration.studentId, registration.semester);
      await this.redis.hdel(hashKey, registration.section.courseId.toString());
    }

    // Xóa studentId khỏi Redis set để cập nhật số lượng sinh viên đã đăng ký
    if (registration.sectionId) {
      const setKey = `course-section:registered:students:${registration.sectionId}`;
      await this.redis.srem(setKey, registration.studentId.toString());
    }

    return;

    // await this.dataSource.transaction(async (manager: EntityManager) => {
    //   // Lock section to update student count
    //   const section = await manager
    //     .createQueryBuilder(CourseSection, 'section')
    //     .setLock('pessimistic_write')
    //     .where('section.sectionId = :sectionId', { sectionId: registration.sectionId })
    //     .getOne();
    //
    //   if (section) {
    //     await manager.update(
    //       CourseSection,
    //       { sectionId: section.sectionId },
    //       { currentStudents: Math.max(section.currentStudents - 1, 0) },
    //     );
    //   }
    //
    //   // Soft delete registration
    //   await manager.softDelete(Registration, registrationId);
    // });
    //
    // // Xoá courseSection tương ứng khỏi Redis hashMap courseId -> courseSection
    // // Hash key: registration:student:{studentId}:semester:{semesterId}:courses
    // if (registration.section?.courseId) {
    //   const hashKey = this.getCourseHashKey(registration.studentId, registration.semester);
    //   await this.redis.hdel(hashKey, registration.section.courseId.toString());
    // }
    //
    // // Xóa studentId khỏi Redis set để cập nhật số lượng sinh viên đã đăng ký
    // if (registration.sectionId) {
    //   const setKey = `course-section:registered:students:${registration.sectionId}`;
    //   await this.redis.srem(setKey, registration.studentId.toString());
    // }
  }

  async getSectionOfStudent(userId: number): Promise<CourseSection[]> {
    const student = await this.studentRepository.findOne({ where: { userId } });
    if (!student) {
      throw new BadRequestException('Sinh viên không tồn tại!');
    }
    return await this.courseSectionRepository.find({
      where: {
        semesterId: student.currentSemester, 
        registrations: {
          studentId: student.id,
        }
      },
      relations:{
        classSchedules: true,
        instructor: true,
        course: true,
      }
    });
  }

  /**
   * Suggest timetable based on student preferences
   * @param user - Current user
   * @param preferences - Student preferences for timetable
   * @returns Suggested timetable with course sections
   */
  async suggestTimetable(user: User, preferences: string = '') {
    const foundStudent = await this.studentRepository.findOne({
      where: { userId: user.userId },
    });

    if (!foundStudent) {
      throw new BadRequestException('Sinh viên không tồn tại!');
    }

    // Get all course sections (same as findAll)
    const allCourseSections = await this.courseSectionService.findAll();

    // Call Python API for suggestions
    const suggestServiceUrl = this.configService.get<string>('SUGGEST_SERVICE_URL') || process.env.SUGGEST_SERVICE_URL;
    
    if (!suggestServiceUrl) {
      throw new BadRequestException('Suggest service URL not configured. Please set SUGGEST_SERVICE_URL in .env file');
    }

    try {
      const response = await fetch(`${suggestServiceUrl}/suggest-timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseSections: allCourseSections,
          studentPreferences: preferences,
        }),
      });

      if (!response.ok) {
        // Đọc response body để lấy message lỗi chi tiết từ Python service
        let errorMessage = `Suggest service error: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.message || errorBody.error || errorBody.detail) {
            errorMessage = errorBody.message || errorBody.error || errorBody.detail;
          }
        } catch {
          // Nếu không parse được JSON, thử đọc dưới dạng text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Giữ nguyên errorMessage mặc định
          }
        }
        throw new BadRequestException(errorMessage);
      }

      const result = await response.json();

      if (!result.success || !result.sectionIds || result.sectionIds.length === 0) {
        return [];
      }

      // Get suggested sections by IDs from allCourseSections
      const suggestedSectionIds = result.sectionIds as number[];
      const suggestedSectionIdsSet = new Set(suggestedSectionIds);
      const suggestedSections = allCourseSections.filter(
        section => 
          suggestedSectionIdsSet.has(section.sectionId) &&
          section.semesterId === foundStudent.currentSemester
      );

      // Kiểm tra xung đột lịch học giữa các section
      for (let i = 0; i < suggestedSections.length; i++) {
        if (!suggestedSections[i]) continue;
        
        for (let j = i + 1; j < suggestedSections.length; j++) {
          if (!suggestedSections[j]) continue;
          
          const hasConflict = await this.courseSectionRepository.hasScheduleConflict(
            suggestedSections[i],
            suggestedSections[j]
          );
          
          if (hasConflict) {
            throw new BadRequestException(
              `Phát hiện xung đột lịch học giữa lớp học phần ${suggestedSections[i].sectionCode} và ${suggestedSections[j].sectionCode}`
            );
          }
        }
      }

      return suggestedSections.filter((section): section is CourseSection => !!section);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

