import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassScheduleDto {
  @ApiProperty({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ApiProperty({ description: 'Day of week', example: 'Monday' })
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({ description: 'Start period', example: 1 })
  @IsInt()
  @IsNotEmpty()
  startPeriod: number;

  @ApiProperty({ description: 'End period', example: 2 })
  @IsInt()
  @IsNotEmpty()
  endPeriod: number;

  @ApiPropertyOptional({ description: 'Room', example: 'A101' })
  @IsString()
  @IsOptional()
  room?: string;
}

export class UpdateClassScheduleDto {
  @ApiPropertyOptional({ description: 'Section ID', example: 1 })
  @IsInt()
  @IsOptional()
  sectionId?: number;

  @ApiPropertyOptional({ description: 'Day of week', example: 'Monday' })
  @IsString()
  @IsOptional()
  dayOfWeek?: string;

  @ApiPropertyOptional({ description: 'Start period', example: 1 })
  @IsInt()
  @IsOptional()
  startPeriod?: number;

  @ApiPropertyOptional({ description: 'End period', example: 2 })
  @IsInt()
  @IsOptional()
  endPeriod?: number;

  @ApiPropertyOptional({ description: 'Room', example: 'A101' })
  @IsString()
  @IsOptional()
  room?: string;
}

