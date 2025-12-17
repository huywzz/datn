import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExchangeAction, ExchangeTransactionStatus } from 'src/common/constant/enum';

export class ExchangeRequestItemDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ApiProperty({ description: 'Action to perform', enum: ExchangeAction, example: ExchangeAction.ADD })
  @IsEnum(ExchangeAction)
  @IsNotEmpty()
  action: ExchangeAction;

  @ApiPropertyOptional({ description: 'Note for this item', example: 'Need to change schedule' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateExchangeTransactionDto {
  // @ApiProperty({ description: 'Student ID creating the transaction', example: 1 })
  // @IsInt()
  // @IsNotEmpty()
  // studentId: number;

  @ApiProperty({
    description: 'List of exchange request items',
    type: [ExchangeRequestItemDto],
    example: [
      { sectionId: 1, action: ExchangeAction.REMOVE, note: 'Remove this section' },
      { sectionId: 2, action: ExchangeAction.ADD, note: 'Add this section' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeRequestItemDto)
  @IsNotEmpty()
  items: ExchangeRequestItemDto[];

  @ApiPropertyOptional({ description: 'Transaction description', example: 'Exchange course sections' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: ExchangeTransactionStatus,
    default: ExchangeTransactionStatus.PENDING,
  })
  @IsEnum(ExchangeTransactionStatus)
  @IsOptional()
  status?: string;
}

export class UpdateExchangeTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: ExchangeTransactionStatus,
  })
  @IsEnum(ExchangeTransactionStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsString()
  @IsOptional()
  description?: string;
}

