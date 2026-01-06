import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestTimetableDto {
  @ApiPropertyOptional({ 
    description: 'Mong muốn của sinh viên về thời khóa biểu', 
    example: 'Tôi muốn học vào buổi sáng, không học thứ 7' 
  })
  @IsString()
  @IsOptional()
  preferences?: string;
}

