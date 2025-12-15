import {Controller, Post, Body, Get, Query, Param, ParseIntPipe} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import {StudentService} from '../service/student.service';
import {RegisterStudentDto, LoginStudentDto, FilterStudentDto} from '../dto/student.dto';
import {User} from '../entities/user.entity';
import {Student} from '../entities/student.entity';

@ApiTags('students')
@Controller('students')
export class StudentController {
    constructor(private readonly studentService: StudentService) {
    }

    @Post('register')
    @ApiOperation({summary: 'Register a new student'})
    @ApiResponse({status: 201, description: 'Student registered successfully'})
    @ApiResponse({status: 409, description: 'User with this email already exists'})
    @ApiResponse({status: 404, description: 'Cohort not found'})
    async register(@Body() registerStudentDto: RegisterStudentDto): Promise<{
        user: User;
        student: Student;
        accessToken: string
    }> {
        return await this.studentService.register(registerStudentDto);
    }

    @Post('login')
    @ApiOperation({summary: 'Login student'})
    @ApiResponse({status: 200, description: 'Login successful'})
    @ApiResponse({status: 401, description: 'Invalid credentials'})
    async login(@Body() loginStudentDto: LoginStudentDto): Promise<{
        user: User;
        student: Student;
        accessToken: string
    }> {
        return await this.studentService.login(loginStudentDto);
    }

    @Get()
    @ApiOperation({summary: 'Get students by cohort with optional name search'})
    @ApiResponse({status: 200, description: 'List of students', type: [Student]})
    async findByCohort(@Query() filterStudentDto: FilterStudentDto): Promise<Student[]> {
        return await this.studentService.findByCohort(filterStudentDto);
    }

    @Get('/:id')
    @ApiOperation({summary: 'Get student by id'})
    @ApiResponse({status: 200, description: 'Student'})
    async findById(
        @Param('id', new ParseIntPipe()) id: number
    ): Promise<Student | null> {
        return this.studentService.findById(id);
    }
}

