import { Injectable, NotFoundException } from '@nestjs/common';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { ExchangeTransactionRepository } from '../repository/exchange-transaction.repository';
import { ExchangeRequestRepository } from '../repository/exchange-request.repository';
import { CreateExchangeTransactionDto, UpdateExchangeTransactionDto } from '../dto/exchange-transaction.dto';
import { ExchangeAction, ExchangeRequest } from '../entities/exchange-request.entity';
import { User } from 'src/module/user/entities/user.entity';
import { StudentRepository } from 'src/module/user/repository/student.repository';
import { ExchangeTransactionStatus } from 'src/common/constant/enum';

@Injectable()
export class ExchangeTransactionService {
  constructor(
    private readonly exchangeTransactionRepository: ExchangeTransactionRepository,
    private readonly exchangeRequestRepository: ExchangeRequestRepository,
    private readonly studentRepository: StudentRepository,
  ) {}

  /**
   * Create a new exchange transaction with items
   * @param createDto - Exchange transaction data to create
   * @returns Created exchange transaction with items
   */
  async create(createDto: CreateExchangeTransactionDto, user: User): Promise<ExchangeTransaction | null> {
    const student = await this.studentRepository.findOne({ where: { userId: user.userId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
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

    return await this.findOne(savedTransaction.transactionId);
  }

  /**
   * Find all exchange transactions
   * @returns List of exchange transactions with items
   */
  async findAll(): Promise<ExchangeTransaction[]> {
    return await this.exchangeTransactionRepository.find({
      relations: ['student', 'items', 'items.section'],
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
}

