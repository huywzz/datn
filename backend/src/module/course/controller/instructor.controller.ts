import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InstructorService } from '../service/instructor.service';
import { CreateInstructorDto } from '../dto/instructor.dto';
import { Instructor } from '../entities/instructor.entity';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new instructor' })
  @ApiResponse({ status: 201, description: 'Instructor created successfully', type: Instructor })
  async create(@Body() createInstructorDto: CreateInstructorDto): Promise<Instructor> {
    return await this.instructorService.create(createInstructorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all instructors' })
  @ApiResponse({ status: 200, description: 'List of instructors', type: [Instructor] })
  async findAll(): Promise<Instructor[]> {
    return await this.instructorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get instructor by ID' })
  @ApiResponse({ status: 200, description: 'Instructor found', type: Instructor })
  @ApiResponse({ status: 404, description: 'Instructor not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Instructor | null> {
    return await this.instructorService.findOne(id);
  }
}

