import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { semesterProviders } from './semester.provider';
import { SemesterService } from './service/semester.service';
import { SemesterController } from './controller/semester.controller';

@Module({
  imports: [MysqlProviderModule],
  controllers: [SemesterController],
  providers: [...semesterProviders, SemesterService],
  exports: [SemesterService],
})
export class SemesterModule {}


