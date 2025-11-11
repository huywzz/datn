import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClassScheduleService } from '../service/class-schedule.service';
import { CreateClassScheduleDto } from '../dto/class-schedule.dto';
import { ClassSchedule } from '../entities/class-schedule.entity';

@ApiTags('class-schedules')
@Controller('class-schedules')
export class ClassScheduleController {
  constructor(private readonly classScheduleService: ClassScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class schedule' })
  @ApiResponse({ status: 201, description: 'Class schedule created successfully', type: ClassSchedule })
  async create(@Body() createClassScheduleDto: CreateClassScheduleDto): Promise<ClassSchedule> {
    return await this.classScheduleService.create(createClassScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all class schedules' })
  @ApiResponse({ status: 200, description: 'List of class schedules', type: [ClassSchedule] })
  async findAll(): Promise<ClassSchedule[]> {
    return await this.classScheduleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class schedule by ID' })
  @ApiResponse({ status: 200, description: 'Class schedule found', type: ClassSchedule })
  @ApiResponse({ status: 404, description: 'Class schedule not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ClassSchedule | null> {
    return await this.classScheduleService.findOne(id);
  }
}

