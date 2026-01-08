import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Put, ForbiddenException, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationService } from '../service/registration.service';
import { CreateRegistrationDto } from '../dto/registration.dto';
import { SuggestTimetableDto } from '../dto/suggest-timetable.dto';
import { Registration } from '../entities/registration.entity';
import { SWAGGER_JWT } from 'src/common/constant/global';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt.guard';
import { User } from 'src/module/user/entities/user.entity';
import { CurrentUser } from 'src/module/auth/decorator/user.decorator';
import { UserRole } from 'src/common/constant/enum';
import RoleGuard from 'src/module/auth/guard/role.guard';

@ApiTags('registrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(SWAGGER_JWT)
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new registration' })
  async create(@Body() createRegistrationDto: CreateRegistrationDto, @CurrentUser() user: User) {
    // return user;
    return await this.registrationService.create(createRegistrationDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all registrations' })
  @ApiResponse({ status: 200, description: 'List of registrations', type: [Registration] })
  async findAll(): Promise<Registration[]> {
    return await this.registrationService.findAll();
  }

  @Get('my-schedule')
  @ApiOperation({ summary: 'Get class schedule for current student' })
  @ApiResponse({ status: 200, description: 'Student class schedule' })
  async getMySchedule(@CurrentUser() user: User) {
    return await this.registrationService.getMySchedule(user);
  }

  @Post('suggest-timetable')
  @ApiOperation({ summary: 'Get suggested timetable based on student preferences' })
  @ApiResponse({ status: 200, description: 'Suggested timetable with course sections' })
  async suggestTimetable(
    @Body() suggestTimetableDto: SuggestTimetableDto,
    @CurrentUser() user: User
  ) {
    return await this.registrationService.suggestTimetable(
      user,
      suggestTimetableDto.preferences || ''
    );
  }

  @Get('/section-of-student')
  @ApiOperation({ summary: 'Get section of student' })
  @ApiResponse({ status: 200, description: 'Section of student' })
  async getSectionOfStudent(@CurrentUser() user: User) {
    return await this.registrationService.getSectionOfStudent(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration by ID' })
  @ApiResponse({ status: 200, description: 'Registration found', type: Registration })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.registrationService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel registration' })
  @ApiResponse({ status: 200, description: 'Registration cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('sectionId') sectionId?: string
  ) {
    // Nếu id là '0' hoặc rỗng và có sectionId, thì chỉ dùng sectionId
    const registrationId = id && id !== '0' ? parseInt(id, 10) : undefined;
    const sectionIdNum = sectionId ? parseInt(sectionId, 10) : undefined;
    return await this.registrationService.cancel(registrationId, sectionIdNum, user);
  }
}

