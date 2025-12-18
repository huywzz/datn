import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExchangeTransactionService } from '../service/exchange-transaction.service';
import { ExchangeQueueService } from '../service/exchange-queue.service';
import { ExchangeProcessorService } from '../service/exchange-processor.service';
import { CreateExchangeTransactionDto, UpdateExchangeTransactionDto } from '../dto/exchange-transaction.dto';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { SWAGGER_JWT } from 'src/common/constant/global';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt.guard';
import { User } from 'src/module/user/entities/user.entity';
import { CurrentUser } from 'src/module/auth/decorator/user.decorator';
// import RoleGuard from 'src/module/auth/guard/role.guard';
// import { UserRole } from 'src/common/constant/enum';

@ApiTags('exchange-transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(SWAGGER_JWT)
@Controller('exchange-transactions')
export class ExchangeTransactionController {
  constructor(
    private readonly exchangeTransactionService: ExchangeTransactionService,
    private readonly queueService: ExchangeQueueService,
    private readonly processorService: ExchangeProcessorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exchange transaction' })
  @ApiResponse({ status: 201, description: 'Exchange transaction created successfully', type: ExchangeTransaction })
  async create(@Body() createDto: CreateExchangeTransactionDto, @CurrentUser() user: User) {
    return await this.exchangeTransactionService.create(createDto, user, this.queueService);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exchange transactions' })
  @ApiResponse({ status: 200, description: 'List of exchange transactions', type: [ExchangeTransaction] })
  async findAll(): Promise<ExchangeTransaction[]> {
    return await this.exchangeTransactionService.findAll();
  }

  @Get('student')
  @ApiOperation({ summary: 'Get exchange transactions by student ID' })
  @ApiResponse({ status: 200, description: 'List of exchange transactions', type: [ExchangeTransaction] })
  async findByStudentId(@CurrentUser() user: User): Promise<ExchangeTransaction[]> {
    return await this.exchangeTransactionService.findByStudentId(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exchange transaction by ID' })
  @ApiResponse({ status: 200, description: 'Exchange transaction found', type: ExchangeTransaction })
  @ApiResponse({ status: 404, description: 'Exchange transaction not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExchangeTransaction | null> {
    return await this.exchangeTransactionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update exchange transaction' })
  @ApiResponse({ status: 200, description: 'Exchange transaction updated successfully', type: ExchangeTransaction })
  @ApiResponse({ status: 404, description: 'Exchange transaction not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExchangeTransactionDto,
  ): Promise<ExchangeTransaction | null> {
    return await this.exchangeTransactionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete exchange transaction' })
  @ApiResponse({ status: 200, description: 'Exchange transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exchange transaction not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.exchangeTransactionService.remove(id);
    return { message: 'Exchange transaction deleted successfully' };
  }

  // @Post('queue/process')
  // // @UseGuards(RoleGuard(UserRole.ADMIN))
  // @ApiOperation({ summary: 'Manually trigger queue processing (Admin only)' })
  // @ApiResponse({ status: 200, description: 'Queue processing triggered' })
  // async triggerQueueProcessing(): Promise<{ message: string }> {
  //   return await this.processorService.triggerProcessing();
  // }
  //
  // @Get('queue/info')
  // // @UseGuards(RoleGuard(UserRole.ADMIN))
  // @ApiOperation({ summary: 'Get queue information' })
  // @ApiResponse({ status: 200, description: 'Queue information' })
  // async getQueueInfo(): Promise<{
  //   size: number;
  //   transactionIds: number[];
  //   isProcessing: boolean;
  // }> {
  //   return await this.processorService.getQueueInfo();
  // }
  //
  // @Post(':id/execute-single')
  // // @UseGuards(RoleGuard(UserRole.ADMIN))
  // @ApiOperation({ summary: 'Execute a single exchange transaction' })
  // @ApiResponse({ status: 200, description: 'Transaction executed successfully' })
  // async executeSingleTransaction(@Param('id', ParseIntPipe) id: number): Promise<{
  //   success: boolean;
  //   message: string;
  //   transaction: ExchangeTransaction;
  // }> {
  //   return await this.exchangeTransactionService.executeSingleTransaction(id);
  // }
  //
  // @Post('execute-pair')
  // // @UseGuards(RoleGuard(UserRole.ADMIN))
  // @ApiOperation({ summary: 'Execute two exchange transactions together' })
  // @ApiResponse({ status: 200, description: 'Transactions executed successfully' })
  // async executeTransaction(
  //   @Body() body: { transaction1Id: number; transaction2Id: number },
  // ): Promise<{
  //   success: boolean;
  //   message: string;
  //   transaction1: ExchangeTransaction;
  //   transaction2: ExchangeTransaction;
  // }> {
  //   return await this.exchangeTransactionService.executeTransaction(
  //     body.transaction1Id,
  //     body.transaction2Id,
  //   );
  // }
}

