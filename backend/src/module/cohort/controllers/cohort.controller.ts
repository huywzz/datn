import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CohortService } from '../services/cohort.service';
import { CreateCohortDto, UpdateCohortDto } from '../dto/cohort.dto';
import { Cohort } from '../entities/cohort.entity';

@ApiTags('cohorts')
@Controller('cohorts')
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cohort' })
  @ApiResponse({ status: 201, description: 'Cohort created successfully', type: Cohort })
  @ApiResponse({ status: 409, description: 'Cohort with this ID already exists' })
  async create(@Body() createCohortDto: CreateCohortDto): Promise<Cohort> {
    return await this.cohortService.create(createCohortDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cohorts' })
  @ApiResponse({ status: 200, description: 'List of cohorts', type: [Cohort] })
  async findAll(): Promise<Cohort[]> {
    return await this.cohortService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cohort by ID' })
  @ApiResponse({ status: 200, description: 'Cohort found', type: Cohort })
  @ApiResponse({ status: 404, description: 'Cohort not found' })
  async findOne(@Param('id') id: string): Promise<Cohort> {
    return await this.cohortService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cohort' })
  @ApiResponse({ status: 200, description: 'Cohort updated successfully', type: Cohort })
  @ApiResponse({ status: 404, description: 'Cohort not found' })
  @ApiResponse({ status: 409, description: 'Invalid year range' })
  async update(@Param('id') id: string, @Body() updateCohortDto: UpdateCohortDto): Promise<Cohort> {
    return await this.cohortService.update(id, updateCohortDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cohort' })
  @ApiResponse({ status: 200, description: 'Cohort deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cohort not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.cohortService.remove(id);
  }
}

