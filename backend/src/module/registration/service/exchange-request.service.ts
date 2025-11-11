import { Injectable } from '@nestjs/common';
import { ExchangeRequest } from '../entities/exchange-request.entity';
import { ExchangeRequestRepository } from '../repository/exchange-request.repository';
import { CreateExchangeRequestDto } from '../dto/exchange-request.dto';

@Injectable()
export class ExchangeRequestService {
  constructor(
    private readonly exchangeRequestRepository: ExchangeRequestRepository,
  ) {}

  /**
   * Create a new exchange request
   * @param createExchangeRequestDto - Exchange request data to create
   * @returns Created exchange request
   */
  async create(createExchangeRequestDto: CreateExchangeRequestDto): Promise<ExchangeRequest> {
    const exchangeRequest = this.exchangeRequestRepository.create({
      requesterId: createExchangeRequestDto.requesterId,
      fromSectionId: createExchangeRequestDto.fromSectionId,
      desiredSectionId: createExchangeRequestDto.desiredSectionId,
      accepterId: createExchangeRequestDto.accepterId,
      status: createExchangeRequestDto.status || 'pending',
    });

    return await this.exchangeRequestRepository.save(exchangeRequest);
  }

  /**
   * Find all exchange requests
   * @returns List of exchange requests
   */
  async findAll(): Promise<ExchangeRequest[]> {
    return await this.exchangeRequestRepository.find({
      relations: ['requester', 'accepter', 'fromSection', 'desiredSection'],
    });
  }

  /**
   * Find exchange request by ID
   * @param exchangeId - Exchange request ID
   * @returns Exchange request or null
   */
  async findOne(exchangeId: number): Promise<ExchangeRequest | null> {
    return await this.exchangeRequestRepository.findOne({
      where: { exchangeId },
      relations: ['requester', 'accepter', 'fromSection', 'desiredSection'],
    });
  }
}

