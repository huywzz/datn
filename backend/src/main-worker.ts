import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import { WorkerLoggerModule } from './common/worker-logger.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { QueueConsumerModule } from './module/queue-consumer/queue-consumer.module';

async function bootstrapWorker() {
    const app = await NestFactory.create<NestExpressApplication>(QueueConsumerModule);

    // Use Winston logger for worker
    // const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    await app.listen(process.env.WORKER_APP_PORT || 8001);
}

bootstrapWorker();
