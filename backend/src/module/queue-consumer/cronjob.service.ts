import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeProcessorService } from '../registration/service/exchange-processor.service';

@Injectable()
export class CronjobService {
    private readonly logger = new Logger(CronjobService.name);
    private readonly cronJob: string;
    constructor(private readonly exchangeProcessorService: ExchangeProcessorService) {
        this.cronJob = '*/10 * * * * *'
    }
    @Cron(process.env.CRON_SCHEDULE || CronExpression.EVERY_10_MINUTES) // Chạy mỗi 10 giây
    handleCron() {
        this.logger.log('hello');
    }

    @Cron(process.env.EXCHANGE_QUEUE_INTERVAL_TIME || CronExpression.EVERY_10_SECONDS)
    async triggerExchangeQueueProcessing() {
        this.logger.log('Trigger xử lý Exchange Queue');
        await this.exchangeProcessorService.processQueue().catch(error => {
            this.logger.error(`Lỗi khi xử lý Exchange Queue: ${error.message}`);
        });
    }
}
