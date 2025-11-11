import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Registration } from '../entities/registration.entity';
import { RegistrationRepository } from '../repository/registration.repository';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { User } from 'src/module/user/entities/user.entity';
import { StudentRepository } from 'src/module/user/repository/student.repository';
import { CourseSection } from 'src/module/course/entities/course-section.entity';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly courseSectionRepository: CourseSectionRepository,
    // private readonly userService: UserService,
    private readonly studentRepository: StudentRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new registration
   * @param createRegistrationDto - Registration data to create
   * @returns Created registration
   */
  async create(createRegistrationDto: CreateRegistrationDto, user: User) {
    const foundStudent = await this.studentRepository.findOne({
      where: { userId: user.userId },
    });
    console.log(foundStudent);

    if (!foundStudent) {
      throw new BadRequestException('Sinh viên không tồn tại!');
    }

    const foundCourseSection = await this.courseSectionRepository.findOne({
      where: { sectionId: createRegistrationDto.sectionId },
      relations: {
        classSchedules:true,
        semester:true,
      }
    });

    if (!foundCourseSection) {
      throw new BadRequestException('Lớp học phần không tồn tại!');
    }


    if(foundCourseSection.maxStudents===foundCourseSection.currentStudents) {
      throw new BadRequestException('Lớp học phần đã đầy!');
    }

    const sectionRegistered = await this.registrationRepository.find({
      where: {
        section: {
          semesterId:foundStudent.currentSemester,
        },
        student: {
          userId: user.userId,
        },
      },
      relations: {
        section: {
          classSchedules:true,
        },

      }
    })

    // Kiểm tra xem đã đăng ký môn học này chưa (một sinh viên chỉ được đăng ký 1 section của 1 môn học)
    const registeredCourseIds = sectionRegistered.map(
      registration => registration.section?.courseId
    ).filter((courseId): courseId is number => courseId !== undefined);

    if (registeredCourseIds.includes(foundCourseSection.courseId)) {
      const existingSection = sectionRegistered.find(
        reg => reg.section?.courseId === foundCourseSection.courseId
      );
      throw new BadRequestException(
        `Bạn đã đăng ký môn học này ở lớp ${existingSection?.section?.sectionCode || ''}. ` +
        `Mỗi sinh viên chỉ được đăng ký 1 học phần của một môn học.`
      );
    }

    // Kiểm tra trùng giờ học với các lớp đã đăng ký
    if (foundCourseSection.classSchedules && foundCourseSection.classSchedules.length > 0) {
      // Lấy tất cả classSchedules từ các section đã đăng ký, kèm thông tin section để báo lỗi
      const currentClassSchedulesWithSection = sectionRegistered
        .filter(registration => registration.section?.classSchedules && registration.section.classSchedules.length > 0)
        .flatMap(registration =>
          registration.section.classSchedules.map(schedule => ({
            schedule,
            sectionCode: registration.section.sectionCode,
          }))
        );

      const newSectionForRegistration = foundCourseSection.classSchedules;

      // Kiểm tra từng lịch học mới với các lịch học đã có
      for (const newSchedule of newSectionForRegistration) {
        for (const { schedule: currentSchedule, sectionCode } of currentClassSchedulesWithSection) {
          // Kiểm tra trùng ngày trong tuần
          if (newSchedule.dayOfWeek === currentSchedule.dayOfWeek) {
            // Kiểm tra chồng chéo khoảng thời gian
            // Hai khoảng chồng chéo khi: newStart <= currentEnd AND newEnd >= currentStart
            if (
              newSchedule.startPeriod <= currentSchedule.endPeriod &&
              newSchedule.endPeriod >= currentSchedule.startPeriod
            ) {
              throw new BadRequestException(
                `Lớp học phần này bị trùng giờ với lớp ${sectionCode} ` +
                `(Thứ ${newSchedule.dayOfWeek}, Tiết ${currentSchedule.startPeriod}-${currentSchedule.endPeriod})`
              );
            }
          }
        }
      }
    }

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

      // Load lại registration với relations để trả về đầy đủ thông tin
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
}

