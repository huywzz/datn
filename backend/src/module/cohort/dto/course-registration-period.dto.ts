import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CreateCourseRegistrationPeriodDto {
  @ApiProperty({ description: 'Registration start time', example: '2025-08-01T01:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Registration end time', example: '2025-08-05T01:00:00Z' })
  @IsDateString()
  endTime: string;
}

export class UpdateCourseRegistrationPeriodDto {
  @ApiPropertyOptional({ description: 'Registration start time', example: '2025-08-01T01:00:00Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Registration end time', example: '2025-08-05T01:00:00Z' })
  @IsDateString()
  @IsOptional()
  endTime?: string;
}

