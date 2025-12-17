import { BadRequestException, Injectable } from '@nestjs/common';
import { CourseSection } from 'src/module/course/entities/course-section.entity';
import { CourseRegistrationPeriodRepository } from 'src/module/cohort/repository/course-registration-period.repository';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { RegistrationRepository } from '../repository/registration.repository';

@Injectable()
export class RegistrationValidationService {
  constructor(
    private readonly courseRegistrationPeriodRepository: CourseRegistrationPeriodRepository,
    private readonly courseSectionRepository: CourseSectionRepository,
    private readonly registrationRepository: RegistrationRepository,
  ) { }

  /**
   * Kiểm tra thời gian đăng ký có đang mở không
   * @throws BadRequestException nếu không có thời gian đăng ký đang mở
   */
  async validateRegistrationPeriod(): Promise<void> {
    const foundCohortRegistrationSchedule = await this.courseRegistrationPeriodRepository.findOne({
      where: { status: true },
    });

    if (!foundCohortRegistrationSchedule) {
      throw new BadRequestException('Không có đăng ký được!');
    }
  }

  /**
   * Lấy và validate course section tồn tại
   * @param sectionId - ID của section
   * @returns CourseSection nếu tồn tại
   * @throws BadRequestException nếu không tồn tại
   */
  async validateAndGetCourseSection(sectionId: number): Promise<CourseSection> {
    const foundCourseSection = await this.courseSectionRepository.findOne({
      where: { sectionId },
      relations: {
        classSchedules: true,
        semester: true,
      },
    });

    if (!foundCourseSection) {
      throw new BadRequestException('Lớp học phần không tồn tại!');
    }

    return foundCourseSection;
  }

  /**
   * Kiểm tra lớp học phần còn chỗ trống không
   * @param courseSection - Course section cần kiểm tra
   * @throws BadRequestException nếu lớp đã đầy
   */
  validateSectionCapacity(courseSection: CourseSection): void {
    if (courseSection.maxStudents <= courseSection.currentStudents) {
      throw new BadRequestException('Lớp học phần đã đầy!');
    }
  }

  /**
   * Kiểm tra sinh viên đã đăng ký môn học này chưa
   * @param studentId - ID của sinh viên
   * @param semesterId - ID của học kỳ
   * @param courseId - ID của môn học cần kiểm tra
   * @throws BadRequestException nếu đã đăng ký môn học này
   */
  async validateNotRegisteredSameCourse(
    studentId: number,
    semesterId: number,
    courseId: number,
  ): Promise<void> {
    const existingSection =
      await this.courseSectionRepository.findRegisteredCourseSectionByCourseIdFromCache(
        studentId,
        semesterId,
        courseId,
      );

    if (existingSection) {
      throw new BadRequestException(
        `Bạn đã đăng ký môn học này ở lớp ${existingSection.sectionCode || ''}. ` +
        `Mỗi sinh viên chỉ được đăng ký 1 học phần của một môn học.`,
      );
    }
  }

  /**
   * Kiểm tra trùng giờ học với các lớp đã đăng ký
   * @param newSection - Section mới muốn đăng ký
  * @param registeredSections - Danh sách các section đã đăng ký
   * @throws BadRequestException nếu bị trùng giờ
   */
  async validateNoScheduleConflict(
    newSection: CourseSection,
    registeredSections: CourseSection[],
  ): Promise<void> {
    if (!newSection.classSchedules || newSection.classSchedules.length === 0) {
      return; // Không có lịch học thì không cần kiểm tra
    }

    // Kiểm tra từng section đã đăng ký với section mới, dùng cache conflict
    for (const registeredSection of registeredSections) {
      const hasConflict = await this.courseSectionRepository.hasScheduleConflictCached(
        newSection,
        registeredSection,
      );

      if (hasConflict) {
        throw new BadRequestException(
          `Lớp học phần này bị trùng giờ với lớp ${registeredSection.sectionCode}`,
        );
      }
    }
  }

  /**
   * Validate tất cả các điều kiện đăng ký
   * @param studentId - ID của sinh viên
   * @param semesterId - ID của học kỳ
   * @param sectionId - ID của section muốn đăng ký
   * @returns CourseSection và danh sách section đã đăng ký
   * @throws BadRequestException nếu không thỏa mãn điều kiện
   */
  async validateRegistration(
    studentId: number,
    semesterId: number,
    sectionId: number,
  ): Promise<CourseSection> {
    // 1. Kiểm tra thời gian đăng ký
    await this.validateRegistrationPeriod();

    // 2. Lấy và validate course section
    const courseSection = await this.validateAndGetCourseSection(sectionId);

    // 3. Kiểm tra lớp còn chỗ trống
    this.validateSectionCapacity(courseSection);

    // 4. Kiểm tra đã đăng ký môn học này chưa (dùng Redis hash)
    await this.validateNotRegisteredSameCourse(studentId, semesterId, courseSection.courseId);


    // 6. Kiểm tra trùng giờ học (dùng cache conflict + cache danh sách section đã đăng ký)
    const sectionRegistered = await this.courseSectionRepository.getStudentRegisteredSectionsFromCache(
      studentId,
      semesterId,
    );
    await this.validateNoScheduleConflict(courseSection, sectionRegistered);

    return courseSection;
  }
}
