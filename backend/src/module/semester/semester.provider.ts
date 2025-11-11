import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Semester } from './entities/semester.entity';
import { SEMESTER_REPOSITORY } from 'src/common/constant/repository';
import { SemesterRepository } from './repository/semester.repository';

export const semesterProviders = [
  {
    provide: SEMESTER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Semester).extend(SemesterRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: SemesterRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Semester).extend(SemesterRepository),
    inject: [getDataSourceToken()],
  },
];


