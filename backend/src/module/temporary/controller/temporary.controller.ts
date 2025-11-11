import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemporaryService } from '../service/temporary.service';
import { CreateTemporaryDto } from '../dto/temporary.dto';
import { Temporary } from '../entities/temporary.entity';
import { CurrentUser } from '../../auth/decorator/user.decorator';
import { User } from '../../user/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guard/jwt.guard';
import { UserRepository } from '../../user/repository/user.repository';
import { SWAGGER_JWT } from 'src/common/constant/global';

@ApiTags('temporaries')
@Controller('temporaries')
export class TemporaryController {
  constructor(
    private readonly temporaryService: TemporaryService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new temporary record' })
  @ApiResponse({ status: 201, description: 'Temporary record created successfully', type: Temporary })
  async create(@Body() createTemporaryDto: CreateTemporaryDto): Promise<Temporary> {
    return await this.temporaryService.create(createTemporaryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all temporary records' })
  @ApiResponse({ status: 200, description: 'List of temporary records', type: [Temporary] })
  async findAll(): Promise<Temporary[]> {
    return await this.temporaryService.findAll();
  }

  @Get('available-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth(SWAGGER_JWT)
  @ApiOperation({ summary: 'Get available courses for registration based on user cohort' })
  @ApiResponse({ status: 200, description: 'List of available courses', type: [Temporary] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User student information not found' })
  async getAvailableCourses(@CurrentUser() user: User): Promise<Temporary[]> {
    // Load user with student relation to get cohortId
    const userWithStudent = await this.userRepository.findOne({
      where: { userId: user.userId },
      relations: ['student'],
    });

    if (!userWithStudent || !userWithStudent.student) {
      throw new NotFoundException('Student information not found for this user');
    }

    const cohortId = userWithStudent.student.cohortId;
    return await this.temporaryService.findAvailableCoursesByCohortId(cohortId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get temporary record by ID' })
  @ApiResponse({ status: 200, description: 'Temporary record found', type: Temporary })
  @ApiResponse({ status: 404, description: 'Temporary record not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Temporary | null> {
    return await this.temporaryService.findOne(id);
  }
}

