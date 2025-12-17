import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExchangeRequestService } from '../service/exchange-request.service';
import { CreateExchangeRequestDto } from '../dto/exchange-request.dto';
import { ExchangeRequest } from '../entities/exchange-request.entity';

@ApiTags('exchange-requests')
@Controller('exchange-requests')
export class ExchangeRequestController {
  constructor(private readonly exchangeRequestService: ExchangeRequestService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new exchange request' })
  // @ApiResponse({ status: 201, description: 'Exchange request created successfully', type: ExchangeRequest })
  // async create(@Body() createExchangeRequestDto: CreateExchangeRequestDto): Promise<ExchangeRequest> {
  //   return await this.exchangeRequestService.create(createExchangeRequestDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all exchange requests' })
  // @ApiResponse({ status: 200, description: 'List of exchange requests', type: [ExchangeRequest] })
  // async findAll(): Promise<ExchangeRequest[]> {
  //   return await this.exchangeRequestService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get exchange request by ID' })
  // @ApiResponse({ status: 200, description: 'Exchange request found', type: ExchangeRequest })
  // @ApiResponse({ status: 404, description: 'Exchange request not found' })
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExchangeRequest | null> {
  //   return await this.exchangeRequestService.findOne(id);
  // }
}

