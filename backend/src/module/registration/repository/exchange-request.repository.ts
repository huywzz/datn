import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ExchangeRequest } from '../entities/exchange-request.entity';
import { EXCHANGE_REQUEST_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class ExchangeRequestRepository extends Repository<ExchangeRequest> {
  constructor(@Inject(EXCHANGE_REQUEST_REPOSITORY) private exchangeRequestRepository: Repository<ExchangeRequest>) {
    super(exchangeRequestRepository.target, exchangeRequestRepository.manager, exchangeRequestRepository.queryRunner);
  }
}

