import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExchangeRequestDto {
  @ApiProperty({ description: 'Requester student ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  requesterId: number;

  @ApiProperty({ description: 'From section ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  fromSectionId: number;

  @ApiProperty({ description: 'Desired section ID', example: 2 })
  @IsInt()
  @IsNotEmpty()
  desiredSectionId: number;

  @ApiPropertyOptional({ description: 'Accepter student ID', example: 2 })
  @IsInt()
  @IsOptional()
  accepterId?: number;

  @ApiPropertyOptional({
    description: 'Exchange request status',
    enum: ['pending', 'matched', 'accepted', 'cancelled', 'completed'],
    default: 'pending',
  })
  @IsEnum(['pending', 'matched', 'accepted', 'cancelled', 'completed'])
  @IsOptional()
  status?: string;
}

export class UpdateExchangeRequestDto {
  @ApiPropertyOptional({ description: 'Requester student ID', example: 1 })
  @IsInt()
  @IsOptional()
  requesterId?: number;

  @ApiPropertyOptional({ description: 'From section ID', example: 1 })
  @IsInt()
  @IsOptional()
  fromSectionId?: number;

  @ApiPropertyOptional({ description: 'Desired section ID', example: 2 })
  @IsInt()
  @IsOptional()
  desiredSectionId?: number;

  @ApiPropertyOptional({ description: 'Accepter student ID', example: 2 })
  @IsInt()
  @IsOptional()
  accepterId?: number;

  @ApiPropertyOptional({
    description: 'Exchange request status',
    enum: ['pending', 'matched', 'accepted', 'cancelled', 'completed'],
  })
  @IsEnum(['pending', 'matched', 'accepted', 'cancelled', 'completed'])
  @IsOptional()
  status?: string;
}

