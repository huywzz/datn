import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRepository } from '../repository/user.repository';
import { StudentRepository } from '../repository/student.repository';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { RegisterStudentDto, LoginStudentDto, FilterStudentDto } from '../dto/student.dto';
import { JwtStrategyService } from '../../auth/service/jwt.strategy';
import { Cohort } from '../../cohort/entities/cohort.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/constant/enum';

@Injectable()
export class StudentService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly studentRepository: StudentRepository,
    private readonly jwtStrategyService: JwtStrategyService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Register a new student
   * @param registerStudentDto - Student registration data
   * @returns Created student with user and access token
   */
  async register(registerStudentDto: RegisterStudentDto): Promise<{ user: User; student: Student; accessToken: string }> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify cohort exists
    const cohortRepository = this.dataSource.getRepository(Cohort);
    const cohortExists = await cohortRepository.findOne({
      where: { id: registerStudentDto.cohortId },
    });

    if (!cohortExists) {
      throw new NotFoundException(`Cohort with ID ${registerStudentDto.cohortId} not found`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerStudentDto.password, 10);

    // Start transaction to create user and student
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const user = this.userRepository.create({
        name: registerStudentDto.fullName,
        email: registerStudentDto.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        status: true,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Create student
      const student = this.studentRepository.create({
        userId: savedUser.userId,
        fullName: registerStudentDto.fullName,
        classCode: registerStudentDto.classCode,
        major: registerStudentDto.major,
        yearOfStudy: registerStudentDto.yearOfStudy,
        currentYear: registerStudentDto.currentYear,
        currentSemester: registerStudentDto.currentSemester,
        cohortId: registerStudentDto.cohortId,
      });

      const savedStudent = await queryRunner.manager.save(Student, student);

      await queryRunner.commitTransaction();

      // Generate JWT token
      const payload = { sub: savedUser.userId, email: savedUser.email, role: savedUser.role };
      const accessToken = this.jwtStrategyService.generateToken(payload);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = savedUser;

      return {
        user: userWithoutPassword as User,
        student: savedStudent,
        accessToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Login student
   * @param loginStudentDto - Student login credentials
   * @returns Student with user and access token
   */
  async login(loginStudentDto: LoginStudentDto): Promise<{ user: User; student: Student; accessToken: string }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginStudentDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is a student
    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Invalid credentials. This account is not a student account.');
    }

    // Check if user has a password
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials. Please use Google login.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginStudentDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.status) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Find student record
    const student = await this.studentRepository.findOne({
      where: { userId: user.userId },
      relations: ['cohort'],
    });

    if (!student) {
      throw new UnauthorizedException('Student record not found');
    }

    // Generate JWT token
    const payload = { sub: user.userId, email: user.email, role: user.role };
    const accessToken = this.jwtStrategyService.generateToken(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      student,
      accessToken,
    };
  }

  /**
   * Find students by cohort with optional name search
   * @param filterStudentDto - Filter parameters
   * @returns List of students in the cohort
   */
  async findByCohort(filterStudentDto: FilterStudentDto): Promise<Student[]> {
    const { cohortId, search } = filterStudentDto;

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.cohort', 'cohort')
      .where('student.cohortId = :cohortId', { cohortId });

    if (search) {
      queryBuilder.andWhere('(student.fullName LIKE :search OR user.name LIKE :search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('student.fullName', 'ASC');

    return await queryBuilder.getMany();
  }
}

