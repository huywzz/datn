import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Temporary } from './entities/temporary.entity';
import { TemporaryRepository } from './repository/temporary.repository';
import { TEMPORARY_REPOSITORY } from 'src/common/constant/repository';

export const temporaryProviders = [
  {
    provide: TEMPORARY_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Temporary).extend(TemporaryRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository class directly for service injection
  {
    provide: TemporaryRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Temporary).extend(TemporaryRepository),
    inject: [getDataSourceToken()],
  },
];

