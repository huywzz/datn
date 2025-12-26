import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CourseRegistrationPeriodService } from '../services/course-registration-period.service';
import {
  CreateCourseRegistrationPeriodDto,
  UpdateCourseRegistrationPeriodDto,
} from '../dto/course-registration-period.dto';
import { CourseRegistrationPeriod } from '../entities/course-registration-period.entity';

@ApiTags('course-registration-periods')
@Controller('course-registration-periods')
export class CourseRegistrationPeriodController {
  constructor(private readonly periodService: CourseRegistrationPeriodService) { }

  @Post()
  @ApiOperation({ summary: 'Create course registration period' })
  @ApiResponse({
    status: 201,
    description: 'Registration period created successfully',
    type: CourseRegistrationPeriod,
  })
  async create(
    @Body() dto: CreateCourseRegistrationPeriodDto,
  ): Promise<CourseRegistrationPeriod> {
    return await this.periodService.create(dto);
  }

  // @Get()
  // @ApiOperation({ summary: 'List registration periods' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of registration periods',
  //   type: [CourseRegistrationPeriod],
  // })
  // async findAll(): Promise<CourseRegistrationPeriod[]> {
  //   return await this.periodService.findAll();
  // }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration period by ID' })
  @ApiResponse({ status: 200, description: 'Registration period found', type: CourseRegistrationPeriod })
  @ApiResponse({ status: 404, description: 'Registration period not found' })
  async findOne(@Param('id') id: string): Promise<CourseRegistrationPeriod> {
    return await this.periodService.findOne(Number(id));
  }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update registration period' })
  // @ApiResponse({ status: 200, description: 'Registration period updated', type: CourseRegistrationPeriod })
  // async update(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateCourseRegistrationPeriodDto,
  // ): Promise<CourseRegistrationPeriod> {
  //   return await this.periodService.update(Number(id), dto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete registration period' })
  // @ApiResponse({ status: 200, description: 'Registration period removed' })
  // async remove(@Param('id') id: string): Promise<void> {
  //   return await this.periodService.remove(Number(id));
  // }
}

