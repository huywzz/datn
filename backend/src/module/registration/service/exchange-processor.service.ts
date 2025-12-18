import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExchangeQueueService } from './exchange-queue.service';
import { ExchangeTransactionService } from './exchange-transaction.service';
import { ExchangeTransactionRepository } from '../repository/exchange-transaction.repository';
import { ExchangeTransactionStatus } from 'src/common/constant/enum';

/**
 * Service để xử lý queue và matching các exchange transactions
 */
@Injectable()
export class ExchangeProcessorService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeProcessorService.name);
  private isProcessing = false;
  private readonly intervalSeconds: number;

  constructor(
    private readonly queueService: ExchangeQueueService,
    private readonly transactionService: ExchangeTransactionService,
    private readonly transactionRepository: ExchangeTransactionRepository,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Lấy interval từ env, mặc định là 60 giây
    this.intervalSeconds = parseInt(
      this.configService.get<string>('EXCHANGE_QUEUE_INTERVAL_TIME', '60'),
      10,
    );
  }

  /**
   * Khởi tạo cron job với interval từ env khi module được load
   */
  onModuleInit() {
    const intervalMs = this.intervalSeconds * 1000;
    this.logger.log(`Khởi tạo queue processor với interval: ${this.intervalSeconds} giây`);

    // Tạo interval để xử lý queue
    const interval = setInterval(() => {
      this.processQueue().catch(error => {
        this.logger.error(`Lỗi trong interval processing: ${error.message}`);
      });
    }, intervalMs);

    // Đăng ký interval với scheduler registry để có thể quản lý sau này
    this.schedulerRegistry.addInterval('exchangeQueueProcessor', interval);

    this.logger.log('Queue processor đã được khởi tạo thành công');
  }

  /**
   * Xử lý queue tự động theo interval từ env
   * Method này được gọi bởi setInterval trong onModuleInit
   */
  async processQueue(): Promise<void> {
    // Kiểm tra nếu đang xử lý thì bỏ qua
    if (this.isProcessing) {
      this.logger.log('Queue đang được xử lý, bỏ qua lần chạy này');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Bắt đầu xử lý queue exchange transactions');

    try {
      const queueSize = await this.queueService.getQueueSize();
      if (queueSize === 0) {
        this.logger.log('Queue rỗng, không có gì để xử lý');
        return;
      }

      this.logger.log(`Queue hiện có ${queueSize} transactions`);

      // Lấy transaction từ queue (pop)
      const transactionId = await this.queueService.popFromQueue();
      if (!transactionId) {
        this.logger.log('Không lấy được transaction từ queue');
        return;
      }

      this.logger.log(`Đang xử lý transaction ID: ${transactionId}`);

      // Kiểm tra transaction còn tồn tại và ở trạng thái PENDING không
      const transaction = await this.transactionRepository.findOne({
        where: { transactionId },
      });

      if (!transaction) {
        this.logger.warn(`Transaction ${transactionId} không tồn tại, bỏ qua`);
        return;
      }

      if (transaction.status !== ExchangeTransactionStatus.PENDING) {
        this.logger.log(`Transaction ${transactionId} không còn ở trạng thái PENDING, bỏ qua`);
        return;
      }

      // Đánh dấu đang xử lý
      await this.queueService.markAsProcessing(transactionId);

      // Bước 1: Thử thực hiện transaction này một mình
      const singleResult = await this.trySingleExecution(transactionId);
      if (singleResult.success) {
        this.logger.log(`✅ Transaction ${transactionId} đã được thực hiện độc lập thành công`);
        await this.queueService.unmarkAsProcessing(transactionId);
        return;
      }

      this.logger.log(`❌ Transaction ${transactionId} không thể thực hiện độc lập: ${singleResult.error}`);

      // Bước 2: Thử ghép với từng transaction còn lại trong queue
      const pairResult = await this.tryPairExecution(transactionId);
      if (pairResult.success) {
        this.logger.log(
          `✅ Transaction ${transactionId} đã được ghép với transaction ${pairResult.pairedWith} thành công`,
        );
        await this.queueService.unmarkAsProcessing(transactionId);
        // Xóa transaction đã ghép thành công khỏi queue
        if (pairResult.pairedWith) {
          await this.queueService.removeFromQueue(pairResult.pairedWith);
        }
        return;
      }

      this.logger.log(
        `❌ Transaction ${transactionId} không thể ghép với bất kỳ transaction nào: ${pairResult.error}`,
      );

      // Bước 3: Không thực hiện được, thêm lại vào queue
      await this.queueService.addToQueue(transactionId);
      await this.queueService.unmarkAsProcessing(transactionId);
      this.logger.log(`Transaction ${transactionId} đã được thêm lại vào queue`);
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý queue: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
      this.logger.log('Hoàn thành xử lý queue');
    }
  }

  /**
   * Thử thực hiện transaction một mình
   * @param transactionId - ID của transaction
   * @returns Kết quả thực hiện
   */
  private async trySingleExecution(transactionId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.transactionService.executeSingleTransaction(transactionId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Thử ghép transaction với từng transaction khác trong queue
   * @param transactionId - ID của transaction cần ghép
   * @returns Kết quả thực hiện
   */
  private async tryPairExecution(transactionId: number): Promise<{
    success: boolean;
    pairedWith?: number;
    error?: string;
  }> {
    try {
      // Lấy tất cả transaction IDs còn lại trong queue
      const queueTransactionIds = await this.queueService.getAllInQueue();

      if (queueTransactionIds.length === 0) {
        return {
          success: false,
          error: 'Không có transaction nào khác trong queue để ghép',
        };
      }

      // Thử ghép với từng transaction
      for (const otherTransactionId of queueTransactionIds) {
        // Bỏ qua nếu đang được xử lý
        if (await this.queueService.isProcessing(otherTransactionId)) {
          continue;
        }

        // Kiểm tra transaction còn tồn tại và ở trạng thái PENDING không
        const otherTransaction = await this.transactionRepository.findOne({
          where: { transactionId: otherTransactionId },
        });

        if (!otherTransaction || otherTransaction.status !== ExchangeTransactionStatus.PENDING) {
          // Xóa transaction không hợp lệ khỏi queue
          await this.queueService.removeFromQueue(otherTransactionId);
          continue;
        }

        try {
          this.logger.log(`Thử ghép transaction ${transactionId} với ${otherTransactionId}`);
          await this.transactionService.executeTransaction(transactionId, otherTransactionId);
          return {
            success: true,
            pairedWith: otherTransactionId,
          };
        } catch (error) {
          this.logger.log(`Không thể ghép với transaction ${otherTransactionId}: ${error.message}`);
        }
      }

      return {
        success: false,
        error: 'Không thể ghép với bất kỳ transaction nào trong queue',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Manual trigger để xử lý queue ngay lập tức (dùng cho admin hoặc testing)
   */
  async triggerProcessing(): Promise<{ message: string }> {
    this.logger.log('Manual trigger xử lý queue');
    // Không await để không block request
    this.processQueue().catch(error => {
      this.logger.error(`Lỗi khi manual trigger: ${error.message}`);
    });
    return {
      message: 'Đã trigger xử lý queue',
    };
  }

  /**
   * Lấy thông tin queue
   */
  async getQueueInfo(): Promise<{
    size: number;
    transactionIds: number[];
    isProcessing: boolean;
  }> {
    return {
      size: await this.queueService.getQueueSize(),
      transactionIds: await this.queueService.getAllInQueue(),
      isProcessing: this.isProcessing,
    };
  }
}

