import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CronjobService } from "./cronjob.service";
import { MysqlProviderModule, ProviderModule } from "src/provider";
import { CourseModule } from "../course/course.module";
import { RegistrationModule } from "../registration/registration.module";
import { UserModule } from "../user/user.module";
import { CohortModule } from "../cohort/cohort.module";
import { ConfigModule } from "@nestjs/config";
@Module({
    imports: [ScheduleModule.forRoot(), ProviderModule, CourseModule, RegistrationModule, UserModule, CohortModule, ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
    }),],
    providers: [CronjobService],
    exports: [CronjobService],
})
export class QueueConsumerModule { }