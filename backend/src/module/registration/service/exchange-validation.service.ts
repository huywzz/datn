import { BadRequestException, Injectable } from '@nestjs/common';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { RegistrationValidationService } from './registration-validation.service';
import { ExchangeTransactionRepository } from '../repository/exchange-transaction.repository';
import { CreateExchangeTransactionDto } from '../dto/exchange-transaction.dto';
import { ExchangeAction } from 'src/common/constant/enum';
import { In } from 'typeorm';

@Injectable()
export class ExchangeValidationService {
  constructor(
    private readonly courseSectionRepository: CourseSectionRepository,
    private readonly registrationValidationService: RegistrationValidationService,
    private readonly exchangeTransactionRepository: ExchangeTransactionRepository,
  ) { }

  /**
   * Validate các sectionId trùng nhau trong một danh sách
   * @param sectionIds - Danh sách section IDs cần kiểm tra
   * @param action - Loại action (ADD hoặc REMOVE) để hiển thị trong thông báo lỗi
   * @throws BadRequestException nếu có sectionId trùng lặp
   */
  private validateDuplicateSectionIds(sectionIds: number[], action: string): void {
    const seenIds = new Set<number>();
    for (const sectionId of sectionIds) {
      if (seenIds.has(sectionId)) {
        const actionText = action === ExchangeAction.ADD ? 'thêm (ADD)' : 'xóa (REMOVE)';
        throw new BadRequestException(
          `Mỗi lớp học phần chỉ được ${actionText} một lần.`,
        );
      }
      seenIds.add(sectionId);
    }
  }

  /**
   * Validate các section trùng nhau trong transaction
   * @param items - Danh sách các exchange request items
   * @throws BadRequestException nếu có section trùng lặp
   */
  private validateDuplicateSections(items: CreateExchangeTransactionDto['items']): void {
    // Tách items thành 2 list: ADD và REMOVE
    const addItems = items.filter(item => item.action === ExchangeAction.ADD);
    const removeItems = items.filter(item => item.action === ExchangeAction.REMOVE);

    // Extract sectionIds từ mỗi list
    const addSectionIds = addItems.map(item => item.sectionId);
    const removeSectionIds = removeItems.map(item => item.sectionId);

    // Validate trùng lặp cho từng list
    this.validateDuplicateSectionIds(addSectionIds, ExchangeAction.ADD);
    this.validateDuplicateSectionIds(removeSectionIds, ExchangeAction.REMOVE);
  }

  /**
   * Lấy danh sách các course sections đã đăng ký của sinh viên
   * @param studentId - ID của sinh viên
   * @param semesterId - ID của học kỳ
   * @returns Danh sách course sections đã đăng ký
   */
  private async getRegisteredSections(
    studentId: number,
    semesterId: number,
  ): Promise<any[]> {
    return await this.courseSectionRepository.find({
      where: {
        semesterId: semesterId,
        registrations: {
          studentId: studentId,
          status: 'active',
        },
      },
      relations: {
        course: true,
        classSchedules: true,
      },
    });
  }

  /**
   * Load các sections theo IDs và validate tồn tại
   * @param sectionIds - Danh sách section IDs cần load
   * @returns Map sectionId -> CourseSection
   * @throws BadRequestException nếu có sectionId không tồn tại
   */
  private async loadSectionsByIds(sectionIds: Set<number>): Promise<Map<number, any>> {
    const sectionsMap = new Map<number, any>();
    if (sectionIds.size === 0) {
      return sectionsMap;
    }

    const sections = await this.courseSectionRepository.find({
      where: { sectionId: In(Array.from(sectionIds)) },
      relations: { course: true, classSchedules: true },
    });

    sections.forEach(section => {
      sectionsMap.set(section.sectionId, section);
    });

    // Kiểm tra nếu có sectionId nào không tìm thấy
    const foundSectionIds = new Set(sections.map(s => s.sectionId));
    const missingSectionIds = Array.from(sectionIds).filter(id => !foundSectionIds.has(id));
    if (missingSectionIds.length > 0) {
      throw new BadRequestException(
        `Các lớp học phần sau không tồn tại: ${missingSectionIds.join(', ')}`,
      );
    }

    return sectionsMap;
  }

  /**
   * Extract các courseId từ các action REMOVE
   * @param items - Danh sách các exchange request items
   * @param sectionsMap - Map sectionId -> CourseSection
   * @returns Set các courseId sẽ bị xóa
   */
  private extractDeleteCourseIds(
    items: CreateExchangeTransactionDto['items'],
    sectionsMap: Map<number, any>,
  ): Set<number> {
    const deleteCourseIds = new Set<number>();
    for (const item of items) {
      if (item.action === ExchangeAction.REMOVE) {
        const section = sectionsMap.get(item.sectionId);
        deleteCourseIds.add(section.courseId);
      }
    }
    return deleteCourseIds;
  }

  /**
   * Validate môn hậu hiệu chỉnh
   * @param addSectionIds - Danh sách section IDs cần thêm
   * @param sectionsMap - Map sectionId -> CourseSection
   * @param deleteCourseIds - Set các courseId sẽ bị xóa
   * @param registeredCourseIds - Set các courseId đã đăng ký
   * @throws BadRequestException nếu vi phạm quy tắc hậu hiệu chỉnh
   */
  private validatePostCorrectionCourses(
    addSectionIds: number[],
    sectionsMap: Map<number, any>,
    deleteCourseIds: Set<number>,
    registeredCourseIds: Set<number>,
  ): void {
    for (const sectionId of addSectionIds) {
      const courseSection = sectionsMap.get(sectionId);
      // Kiểm tra course có chứa 2 course section hậu hiệu chỉnh không (vì mỗi môn học chỉ được đăng ký 1 lần)
      // Nếu course có trong delete => thỏa
      if (deleteCourseIds.has(courseSection.courseId)) {
        continue; // Thỏa điều kiện
      }

      // Nếu không có trong delete và tồn tại trong danh sách đã đăng ký => không được phép
      if (registeredCourseIds.has(courseSection.courseId)) {
        throw new BadRequestException(
          `Môn học ${courseSection.course?.name || courseSection.courseId} là môn hậu hiệu chỉnh và bạn đã đăng ký. ` +
          `Chỉ được phép đăng ký khi có yêu cầu xóa môn học này.`,
        );
      }
    }
  }

  /**
   * Validate lịch học conflict
   * @param addSectionIds - Danh sách section IDs cần thêm
   * @param sectionsMap - Map sectionId -> CourseSection
   * @param registeredSections - Danh sách sections đã đăng ký
   * @param deleteCourseIds - Set các courseId sẽ bị xóa
   * @throws BadRequestException nếu có conflict lịch học
   */
  private async validateScheduleConflicts(
    addSectionIds: number[],
    sectionsMap: Map<number, any>,
    registeredSections: any[],
    deleteCourseIds: Set<number>,
  ): Promise<void> {
    // 1. Bước đầu tiên: có danh sách courseSection đã đăng ký
    // 2. Giả định thao tác delete: xóa các phần tử tồn tại trong deleteCourseIds
    const simulatedRegisteredSections = registeredSections.filter(
      section => !deleteCourseIds.has(section.courseId),
    );

    // 3. Giả định lần lượt thao tác add, vừa add vừa gọi method check schedule conflict
    for (const sectionId of addSectionIds) {
      const courseSection = sectionsMap.get(sectionId);

      // Kiểm tra conflict với danh sách sections hiện tại (sau khi đã xóa và thêm các sections trước đó)
      await this.registrationValidationService.validateNoScheduleConflict(
        courseSection,
        simulatedRegisteredSections,
      );

      // Thêm section vào danh sách giả định để kiểm tra các sections tiếp theo
      simulatedRegisteredSections.push(courseSection);
    }
  }

  /**
   * Validate tạo Exchange Transaction
   * @param studentId - ID của sinh viên
   * @param semesterId - ID của học kỳ
   * @param items - Danh sách các exchange request items
   * @throws BadRequestException nếu không thỏa mãn điều kiện
   */
  async validateCreateTransaction(
    studentId: number,
    semesterId: number,
    items: CreateExchangeTransactionDto['items'],
  ): Promise<void> {
    // Validate các section trùng nhau
    this.validateDuplicateSections(items);

    // Lấy danh sách các course đã đăng ký của sinh viên từ database (không dùng cache)
    const registeredSections = await this.getRegisteredSections(studentId, semesterId);
    const registeredCourseIds = new Set(registeredSections.map(s => s.courseId));
    const registeredSectionIds = new Set(registeredSections.map(s => s.sectionId));
    
    // Kiểm tra các lớp học phần trong yêu cầu REMOVE có tồn tại trong danh sách đã đăng ký không
    if (items.filter(item => item.action === ExchangeAction.REMOVE).some(item => !registeredSectionIds.has(item.sectionId))) {
      throw new BadRequestException(`Một hoặc nhiều lớp học phần trong yêu cầu xóa không tồn tại trong danh sách đã đăng ký!`);
    }
    
    // Thu thập tất cả sectionId từ cả REMOVE và ADD
    const allSectionIds = new Set<number>();
    const addSectionIds: number[] = [];

    for (const item of items) {
      allSectionIds.add(item.sectionId);
      if (item.action === ExchangeAction.ADD) {
        addSectionIds.push(item.sectionId);
      }
    }

    // Load các sections cần thiết
    const sectionsMap = await this.loadSectionsByIds(allSectionIds);

    // Lấy danh sách các courseId trong các action REMOVE
    const deleteCourseIds = this.extractDeleteCourseIds(items, sectionsMap);

    // Validate môn hậu hiệu chỉnh
    this.validatePostCorrectionCourses(
      addSectionIds,
      sectionsMap,
      deleteCourseIds,
      registeredCourseIds,
    );

    // Validate lịch học conflict
    await this.validateScheduleConflicts(
      addSectionIds,
      sectionsMap,
      registeredSections,
      deleteCourseIds,
    );
  }

  /**
   * Validate thực hiện 2 Exchange Transactions
   * @param transaction1Id - ID của transaction thứ nhất
   * @param transaction2Id - ID của transaction thứ hai
   * @param validateTransactions - Có validate cả 2 transactions không (optional, default: true)
   * @throws BadRequestException nếu không thỏa mãn điều kiện
   */
  async validateExecuteTwoTransactions(
    transaction1Id: number,
    transaction2Id: number,
    validateTransactions: boolean = false,
  ): Promise<void> {
    // Lấy thông tin 2 transactions
    const transaction1 = await this.exchangeTransactionRepository.findOne({
      where: { transactionId: transaction1Id },
      relations: ['items', 'items.section', 'student'],
    });

    const transaction2 = await this.exchangeTransactionRepository.findOne({
      where: { transactionId: transaction2Id },
      relations: ['items', 'items.section', 'student'],
    });

    if (!transaction1) {
      throw new BadRequestException(`Transaction với ID ${transaction1Id} không tồn tại!`);
    }

    if (!transaction2) {
      throw new BadRequestException(`Transaction với ID ${transaction2Id} không tồn tại!`);
    }

    // Validate cả 2 TX nếu được yêu cầu
    if (validateTransactions) {
      await this.validateCreateTransaction(
        transaction1.studentId,
        transaction1.student.currentSemester,
        transaction1.items.map(item => ({
          sectionId: item.sectionId,
          action: item.action,
          note: item.note ?? undefined,
        })),
      );

      await this.validateCreateTransaction(
        transaction2.studentId,
        transaction2.student.currentSemester,
        transaction2.items.map(item => ({
          sectionId: item.sectionId,
          action: item.action,
          note: item.note ?? undefined,
        })),
      );
    }

    // Validate thỏa hậu đăng ký
    await this.validatePostRegistrationCapacity(transaction1, transaction2);
  }

  /**
   * Validate thỏa hậu đăng ký cho 2 transactions
   * - Tạm thời lấy ra các course section cùng số lượng
   * - Thực hiện các yêu cầu delete, từ đó trừ số lượng
   * - Thực hiện các yêu cầu đăng ký, từ đó thêm số lượng
   * - Kiểm tra có vượt số lượng hay không
   */
  private async validatePostRegistrationCapacity(
    transaction1: ExchangeTransaction,
    transaction2: ExchangeTransaction,
  ): Promise<void> {
    // Tạo map để theo dõi số lượng sinh viên sau khi thực hiện các action
    // Key: sectionId, Value: { current: number, max: number, changes: number }
    const sectionCapacityMap = new Map<
      number,
      { current: number; max: number; changes: number }
    >();

    // Hàm helper để cập nhật capacity map
    const updateCapacityMap = async (sectionId: number, action: string) => {
      if (!sectionCapacityMap.has(sectionId)) {
        const section = await this.courseSectionRepository.findOne({
          where: { sectionId }, isCache: false,
        });

        if (!section) {
          throw new BadRequestException(`Lớp học phần với ID ${sectionId} không tồn tại!`);
        }

        sectionCapacityMap.set(sectionId, {
          current: section.currentStudents,
          max: section.maxStudents,
          changes: 0,
        });
      }

      const capacity = sectionCapacityMap.get(sectionId)!;
      if (action === ExchangeAction.ADD) {
        capacity.changes += 1;
      } else if (action === ExchangeAction.REMOVE) {
        capacity.changes -= 1;
      }
    };

    // Xử lý transaction 1
    for (const item of transaction1.items) {
      await updateCapacityMap(item.sectionId, item.action);
    }

    // Xử lý transaction 2
    for (const item of transaction2.items) {
      await updateCapacityMap(item.sectionId, item.action);
    }

    // Kiểm tra có vượt số lượng hay không
    for (const [sectionId, capacity] of sectionCapacityMap.entries()) {
      const finalCount = capacity.current + capacity.changes;

      if (finalCount > capacity.max) {
        const section = await this.courseSectionRepository.findOne({
          where: { sectionId },
          relations: { course: true },
          isCache: false
        });

        throw new BadRequestException(
          `Lớp học phần ${section?.sectionCode || sectionId} sẽ vượt quá số lượng cho phép ` +
          `(${finalCount}/${capacity.max}) sau khi thực hiện giao dịch.`,
        );
      }

      if (finalCount < 0) {
        throw new BadRequestException(`Không hợp lệ`);
      }
    }
  }
}

