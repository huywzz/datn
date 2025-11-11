import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Registration } from './entities/registration.entity';
import { ExchangeRequest } from './entities/exchange-request.entity';
import { RegistrationRepository } from './repository/registration.repository';
import { ExchangeRequestRepository } from './repository/exchange-request.repository';
import { REGISTRATION_REPOSITORY, EXCHANGE_REQUEST_REPOSITORY } from 'src/common/constant/repository';

export const registrationProviders = [
  {
    provide: REGISTRATION_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Registration).extend(RegistrationRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: EXCHANGE_REQUEST_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ExchangeRequest).extend(ExchangeRequestRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository classes directly for service injection
  {
    provide: RegistrationRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Registration).extend(RegistrationRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: ExchangeRequestRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ExchangeRequest).extend(ExchangeRequestRepository),
    inject: [getDataSourceToken()],
  },
];

