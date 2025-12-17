import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { EXCHANGE_TRANSACTION_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class ExchangeTransactionRepository extends Repository<ExchangeTransaction> {
  constructor(
    @Inject(EXCHANGE_TRANSACTION_REPOSITORY)
    private exchangeTransactionRepository: Repository<ExchangeTransaction>,
  ) {
    super(
      exchangeTransactionRepository.target,
      exchangeTransactionRepository.manager,
      exchangeTransactionRepository.queryRunner,
    );
  }
}

