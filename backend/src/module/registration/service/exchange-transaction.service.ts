import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { ExchangeTransactionRepository } from '../repository/exchange-transaction.repository';
import { ExchangeRequestRepository } from '../repository/exchange-request.repository';
import { CreateExchangeTransactionDto, UpdateExchangeTransactionDto } from '../dto/exchange-transaction.dto';
import { ExchangeRequest } from '../entities/exchange-request.entity';
import { User } from 'src/module/user/entities/user.entity';
import { StudentRepository } from 'src/module/user/repository/student.repository';
import { ExchangeTransactionStatus, ExchangeAction } from 'src/common/constant/enum';
import { ExchangeValidationService } from './exchange-validation.service';
import { RegistrationRepository } from '../repository/registration.repository';
import { Registration } from '../entities/registration.entity';
import { CourseSectionRepository } from 'src/module/course/repository/course-section.repository';
import { CourseSection } from 'src/module/course/entities/course-section.entity';
import { RedisProviderService } from '../../../provider/redis/redis-provider.service';
import Redis from 'ioredis';

@Injectable()
export class ExchangeTransactionService {
  private readonly redis: Redis;

  constructor(
    private readonly exchangeTransactionRepository: ExchangeTransactionRepository,
    private readonly exchangeRequestRepository: ExchangeRequestRepository,
    private readonly studentRepository: StudentRepository,
    private readonly exchangeValidationService: ExchangeValidationService,
    private readonly registrationRepository: RegistrationRepository,
    private readonly courseSectionRepository: CourseSectionRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
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
   * Create a new exchange transaction with items
   * @param createDto - Exchange transaction data to create
   * @param user - Current user
   * @param queueService - Optional queue service để thêm transaction vào queue
   * @returns Created exchange transaction with items
   */
  async create(
    createDto: CreateExchangeTransactionDto,
    user: User,
    queueService?: any,
  ): Promise<ExchangeTransaction | null> {
    const student = await this.studentRepository.findOne({ where: { userId: user.userId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate transaction trước khi tạo
    await this.exchangeValidationService.validateCreateTransaction(
      student.id,
      student.currentSemester,
      createDto.items,
    );

    const transaction = this.exchangeTransactionRepository.create({
      studentId: student.id,
      status: createDto.status || ExchangeTransactionStatus.PENDING,
      description: createDto.description,
    });

    const savedTransaction = await this.exchangeTransactionRepository.save(transaction);

    // Create exchange request items
    const items = createDto.items.map((item) =>
      this.exchangeRequestRepository.create({
        transactionId: savedTransaction.transactionId,
        sectionId: item.sectionId,
        action: item.action as ExchangeAction,
        note: item.note,
      }),
    );

    await this.exchangeRequestRepository.save(items);

    const createdTransaction = await this.findOne(savedTransaction.transactionId);

    // Thêm vào queue nếu có queueService và status là PENDING
    if (queueService && savedTransaction.status === ExchangeTransactionStatus.PENDING) {
      await queueService.addToQueue(savedTransaction.transactionId);
    }

    return createdTransaction;
  }

  /**
   * Find all exchange transactions
   * @returns List of exchange transactions with items
   */
  async findAll(): Promise<ExchangeTransaction[]> {
    return await this.exchangeTransactionRepository.find({
      relations: ['student', 'items', 'items.section'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find exchange transaction by ID
   * @param transactionId - Exchange transaction ID
   * @returns Exchange transaction or null
   */
  async findOne(transactionId: number): Promise<ExchangeTransaction | null> {
    return await this.exchangeTransactionRepository.findOne({
      where: { transactionId },
      relations: ['student', 'items', 'items.section'],
    });
  }

  /**
   * Find exchange transactions by student ID
   * @param studentId - Student ID
   * @returns List of exchange transactions
   */
  async findByStudentId(userId: number): Promise<ExchangeTransaction[]> {
    const student = await this.studentRepository.findOne({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return await this.exchangeTransactionRepository.find({
      where: { studentId: student.id },
      relations: ['student', 'items', 'items.section'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update exchange transaction
   * @param transactionId - Exchange transaction ID
   * @param updateDto - Update data
   * @returns Updated exchange transaction
   */
  async update(transactionId: number, updateDto: UpdateExchangeTransactionDto): Promise<ExchangeTransaction | null> {
    await this.exchangeTransactionRepository.update(transactionId, updateDto);
    return await this.findOne(transactionId);
  }

  /**
   * Delete exchange transaction
   * @param transactionId - Exchange transaction ID
   */
  async remove(transactionId: number): Promise<void> {
    await this.exchangeTransactionRepository.delete(transactionId);
  }

  /**
   * Execute single exchange transaction
   * Thực hiện 1 giao dịch trao đổi tín chỉ
   * @param transactionId - ID của transaction
   * @returns Object chứa kết quả thực hiện
   */
  async executeSingleTransaction(transactionId: number): Promise<{
    success: boolean;
    message: string;
    transaction: ExchangeTransaction;
  }> {
    // Load transaction với relations
    const transaction = await this.exchangeTransactionRepository.findOne({
      where: { transactionId },
      relations: ['student', 'items', 'items.section'],
    });

    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại!');
    }

    // Validate transaction
    await this.exchangeValidationService.validateCreateTransaction(
      transaction.studentId,
      transaction.student.currentSemester,
      transaction.items.map(item => ({
        sectionId: item.sectionId,
        action: item.action,
        note: item.note ?? undefined,
      })),
    );

    // Tách các action REMOVE và ADD
    const removeItems = transaction.items.filter(item => item.action === ExchangeAction.REMOVE);
    const addItems = transaction.items.filter(item => item.action === ExchangeAction.ADD);

    // Tạo database transaction để thực hiện tất cả các thao tác
    await this.dataSource.transaction(async (manager: EntityManager) => {
      // Thực hiện tất cả REMOVE trước
      for (const item of removeItems) {
        await this.executeRemoveAction(manager, item, transaction);
      }

      // Thực hiện tất cả ADD sau (với kiểm tra capacity)
      for (const item of addItems) {
        await this.executeAddAction(manager, item, transaction);
      }

      // Cập nhật status của transaction thành COMPLETED
      await manager.update(
        ExchangeTransaction,
        { transactionId },
        { status: ExchangeTransactionStatus.COMPLETED },
      );
    });

    // Load lại transaction sau khi update
    const updatedTransaction = await this.findOne(transactionId);

    return {
      success: true,
      message: 'Thực hiện trao đổi tín chỉ thành công!',
      transaction: updatedTransaction!,
    };
  }

  /**
   * Execute two exchange transactions
   * Thực hiện 2 giao dịch trao đổi tín chỉ
   * @param transaction1Id - ID của transaction thứ nhất
   * @param transaction2Id - ID của transaction thứ hai
   * @returns Object chứa kết quả thực hiện
   */
  async executeTransaction(transaction1Id: number, transaction2Id: number): Promise<{
    success: boolean;
    message: string;
    transaction1: ExchangeTransaction;
    transaction2: ExchangeTransaction;
  }> {
    // 1. Validate 2 transactions
    await this.exchangeValidationService.validateExecuteTwoTransactions(
      transaction1Id,
      transaction2Id,
      true, // Validate cả 2 transactions
    );

    // Load 2 transactions với relations
    const transaction1 = await this.exchangeTransactionRepository.findOne({
      where: { transactionId: transaction1Id },
      relations: ['student', 'items', 'items.section'],
    });

    const transaction2 = await this.exchangeTransactionRepository.findOne({
      where: { transactionId: transaction2Id },
      relations: ['student', 'items', 'items.section'],
    });

    if (!transaction1 || !transaction2) {
      throw new NotFoundException('Một hoặc cả hai giao dịch không tồn tại!');
    }

    // 2. Tách các action REMOVE và ADD từ cả 2 transactions
    const allItems = [...transaction1.items, ...transaction2.items];
    const removeItems = allItems.filter(item => item.action === 'REMOVE');
    const addItems = allItems.filter(item => item.action === 'ADD');

    // 3. Tạo database transaction để thực hiện tất cả các thao tác
    await this.dataSource.transaction(async (manager: EntityManager) => {
      // 4. Thực hiện tất cả REMOVE trước
      for (const item of removeItems) {
        const itemTransaction = item.transactionId === transaction1.transactionId ? transaction1 : transaction2;
        await this.executeRemoveAction(manager, item, itemTransaction);
      }

      // 5. Thực hiện tất cả ADD sau (với kiểm tra capacity)
      for (const item of addItems) {
        const itemTransaction = item.transactionId === transaction1.transactionId ? transaction1 : transaction2;
        await this.executeAddAction(manager, item, itemTransaction);
      }

      // 6. Cập nhật status của cả 2 transactions thành COMPLETED
      await manager.update(
        ExchangeTransaction,
        { transactionId: transaction1Id },
        { status: ExchangeTransactionStatus.COMPLETED },
      );

      await manager.update(
        ExchangeTransaction,
        { transactionId: transaction2Id },
        { status: ExchangeTransactionStatus.COMPLETED },
      );
    });

    // Load lại 2 transactions sau khi update
    const updatedTransaction1 = await this.findOne(transaction1Id);
    const updatedTransaction2 = await this.findOne(transaction2Id);

    return {
      success: true,
      message: 'Thực hiện trao đổi tín chỉ thành công!',
      transaction1: updatedTransaction1!,
      transaction2: updatedTransaction2!,
    };
  }

  /**
   * Execute REMOVE action: Xóa registration và giảm currentStudents
   * @param manager - EntityManager trong transaction
   * @param item - Exchange request item
   * @param transaction - Exchange transaction chứa item này
   */
  private async executeRemoveAction(
    manager: EntityManager,
    item: ExchangeRequest,
    transaction: ExchangeTransaction,
  ): Promise<void> {
    // Tìm registration cần xóa
    const registration = await manager.findOne(Registration, {
      where: {
        studentId: transaction.studentId,
        sectionId: item.sectionId,
        status: 'active',
      },
      relations: ['section'],
    });

    if (!registration) {
      throw new BadRequestException(
        `Không tìm thấy đăng ký cho lớp học phần ${item.section?.sectionCode || item.sectionId}`,
      );
    }

    // Lock section để update student count
    const section = await manager
      .createQueryBuilder(CourseSection, 'section')
      .setLock('pessimistic_write')
      .where('section.sectionId = :sectionId', { sectionId: item.sectionId })
      .getOne();

    if (!section) {
      throw new BadRequestException(`Lớp học phần không tồn tại!`);
    }

    // Giảm currentStudents
    await manager.update(
      CourseSection,
      { sectionId: section.sectionId },
      { currentStudents: Math.max(section.currentStudents - 1, 0) },
    );

    // Soft delete registration
    await manager.softDelete(Registration, registration.registrationId);

    // Xóa courseSection tương ứng khỏi Redis hashMap courseId -> courseSection
    if (section.courseId) {
      const hashKey = this.getCourseHashKey(transaction.studentId, transaction.student.currentSemester);
      await this.redis.hdel(hashKey, section.courseId.toString());
    }
  }

  /**
   * Execute ADD action: Tạo registration mới và tăng currentStudents
   * @param manager - EntityManager trong transaction
   * @param item - Exchange request item
   * @param transaction - Exchange transaction chứa item này
   */
  private async executeAddAction(
    manager: EntityManager,
    item: ExchangeRequest,
    transaction: ExchangeTransaction,
  ): Promise<void> {
    // Lock section để kiểm tra và update student count
    const section = await manager
      .createQueryBuilder(CourseSection, 'section')
      .setLock('pessimistic_write')
      .where('section.sectionId = :sectionId', { sectionId: item.sectionId })
      .getOne();

    if (!section) {
      throw new BadRequestException(`Lớp học phần không tồn tại!`);
    }

    // Kiểm tra capacity trước khi thêm
    if (section.currentStudents >= section.maxStudents) {
      throw new BadRequestException(
        `Lớp học phần ${section.sectionCode} đã đầy (${section.currentStudents}/${section.maxStudents})!`,
      );
    }

    // Tạo registration mới
    const newRegistration = manager.create(Registration, {
      studentId: transaction.studentId,
      sectionId: item.sectionId,
      registeredAt: new Date(),
      status: 'active',
      semester: transaction.student.currentSemester,
    });

    await manager.save(Registration, newRegistration);

    // Tăng currentStudents
    await manager.update(
      CourseSection,
      { sectionId: section.sectionId },
      { currentStudents: section.currentStudents + 1 },
    );

    // Lưu hashMap courseId -> courseSection vào Redis cho sinh viên trong học kỳ hiện tại
    const hashKey = this.getCourseHashKey(transaction.studentId, transaction.student.currentSemester);
    await this.redis.hset(
      hashKey,
      section.courseId.toString(),
      JSON.stringify(section),
    );
  }
}

