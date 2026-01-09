import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeProcessorService } from '../registration/service/exchange-processor.service';
import { SyncRegistrationService } from '../registration/service/sync-registration.service';
import { CourseRegistrationPeriodRepository } from '../cohort/repository/course-registration-period.repository';

@Injectable()
export class CronjobService {
    private readonly logger = new Logger(CronjobService.name);
    private readonly cronJob: string;
    constructor(
      private readonly exchangeProcessorService: ExchangeProcessorService,
      private readonly syncRegistrationService: SyncRegistrationService,
      private readonly courseRegistrationPeriodRepository: CourseRegistrationPeriodRepository,
    ) {
        this.cronJob = '*/10 * * * * *'
    }
    @Cron(process.env.CRON_SCHEDULE || CronExpression.EVERY_10_MINUTES) // Chạy mỗi 10 giây
    handleCron() {
        this.logger.log('hello');
    }

    @Cron(process.env.EXCHANGE_QUEUE_INTERVAL_TIME || CronExpression.EVERY_10_SECONDS)
    async triggerExchangeQueueProcessing() {
        // Chỉ chạy exchange khi KHÔNG trong thời gian đăng ký
        const isRegistrationActive = await this.isRegistrationPeriodActive();
        if (isRegistrationActive) {
            this.logger.debug('Đang trong thời gian đăng ký, bỏ qua xử lý Exchange Queue');
            return;
        }

        this.logger.log('Trigger xử lý Exchange Queue');
        await this.exchangeProcessorService.processQueue().catch(error => {
            this.logger.error(`Lỗi khi xử lý Exchange Queue: ${error.message}`);
        });
    }

    /**
     * Định kỳ đồng bộ registrations từ Redis xuống DB
     * Chỉ chạy khi đang trong thời gian đăng ký
     */
    @Cron(process.env.SYNC_REGISTRATION_INTERVAL_TIME || CronExpression.EVERY_MINUTE)
    async triggerSyncRegistrations() {
      // Chỉ chạy sync khi ĐANG trong thời gian đăng ký
      const isRegistrationActive = await this.isRegistrationPeriodActive();
      if (!isRegistrationActive) {
        this.logger.debug('Đã vượt qua thời gian đăng ký, bỏ qua sync registrations');
        return;
      }

      this.logger.log('Bắt đầu đồng bộ registrations từ Redis xuống DB');

      try {
        const results = await this.syncRegistrationService.syncAllFromRedis();

        results.forEach(({ sectionId, createdCount, removedCount }) => {
          this.logger.log(
            `Sync section ${sectionId}: created=${createdCount}, removed=${removedCount}`,
          );
        });

        this.logger.log('Hoàn tất đồng bộ registrations từ Redis xuống DB');
      } catch (error) {
        this.logger.error(
          `Lỗi khi đồng bộ registrations từ Redis xuống DB: ${
            (error as Error).message
          }`,
        );
      }
    }

    /**
     * Kiểm tra xem hiện tại có đang trong thời gian đăng ký không
     * @returns true nếu đang trong thời gian đăng ký (status = true và now >= startTime && now <= endTime)
     */
    private async isRegistrationPeriodActive(): Promise<boolean> {
      try {
        const period = await this.courseRegistrationPeriodRepository.findOne({
          where: { status: true },
        });

        if (!period) {
          return false;
        }

        const now = new Date();
        const startTime = new Date(period.startTime);
        const endTime = new Date(period.endTime);

        return now >= startTime && now <= endTime;
      } catch (error) {
        this.logger.error(
          `Lỗi khi kiểm tra thời gian đăng ký: ${(error as Error).message}`,
        );
        return false;
      }
    }
}
