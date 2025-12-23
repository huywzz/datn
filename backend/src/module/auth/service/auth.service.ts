import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Student } from '../../user/entities/student.entity';
import { LoginDto, RegisterDto, GoogleLoginDto } from '../dto/auth.dto';
import { UserRepository } from '../../user/repository/user.repository';
import { StudentRepository } from '../../user/repository/student.repository';
import { JwtStrategyService } from './jwt.strategy';
import { Cohort } from '../../cohort/entities/cohort.entity';
import { UserRole } from 'src/common/constant/enum';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from 'src/provider/firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly studentRepository: StudentRepository,
    private readonly jwtStrategyService: JwtStrategyService,
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly firebaseService: FirebaseService,
  ) {
  }

  /**
   * Register a new user (admin or student)
   * @param registerDto - Registration data
   * @returns Created user and access token (with student data if role is student)
   */
  async register(registerDto: RegisterDto): Promise<{ user: User; student?: Student; accessToken: string }> {
    // Validate role
    if (!Object.values(UserRole).includes(registerDto.role)) {
      throw new BadRequestException('Invalid role');
    }

    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    // Validate student fields if role is STUDENT
    if (registerDto.role === UserRole.STUDENT) {
      // Verify cohort exists
      const cohortRepository = this.dataSource.getRepository(Cohort);
      const cohortExists = await cohortRepository.findOne({
        where: { id: registerDto.cohortId },
      });

      if (!cohortExists) {
        throw new NotFoundException(`Cohort with ID ${registerDto.cohortId} not found`);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Start transaction if registering student
    const isStudent = registerDto.role === UserRole.STUDENT;
    const queryRunner = isStudent ? this.userRepository.manager.connection.createQueryRunner() : null;
    
    if (isStudent && queryRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      // Create user
      const user = this.userRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
        status: true,
      });

      const savedUser = isStudent && queryRunner 
        ? await queryRunner.manager.save(User, user)
        : await this.userRepository.save(user);

      let student: Student | undefined;

      // Create student record if role is STUDENT
      if (isStudent && registerDto.cohortId) {
        const studentData = this.studentRepository.create({
          userId: savedUser.userId,
          fullName: registerDto.name,
          classCode: registerDto.classCode!,
          major: registerDto.major!,
          yearOfStudy: registerDto.yearOfStudy!,
          currentYear: registerDto.currentYear!,
          currentSemester: registerDto.currentSemester!,
          cohortId: registerDto.cohortId,
          studentCode: registerDto.studentCode!,
        });

        student = queryRunner
          ? await queryRunner.manager.save(Student, studentData)
          : await this.studentRepository.save(studentData);
      }

      if (isStudent && queryRunner) {
        await queryRunner.commitTransaction();
      }

      // Generate JWT token
      const payload = { sub: savedUser.userId, email: savedUser.email, role: savedUser.role,  };
      const accessToken = this.jwtStrategyService.generateToken(payload);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = savedUser;

      const result: { user: User; student?: Student; accessToken: string } = {
        user: userWithoutPassword as User,
        accessToken,
      };

      if (student) {
        result.student = student;
      }

      return result;
    } catch (error) {
      if (isStudent && queryRunner) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (isStudent && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * Login user (admin or student)
   * @param loginDto - Login credentials
   * @returns User and access token (with student data if role is student)
   */
  async login(loginDto: LoginDto): Promise<{ user: User; student?: Student; accessToken: string }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (users registered with Google may not have password)
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials. Please use Google login.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.status) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Check if user role is admin or student
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Invalid credentials. This account role is not supported for login.');
    }

    let student: Student | undefined;

    // Get student data if role is STUDENT
    if (user.role === UserRole.STUDENT) {
      const studentRecord = await this.studentRepository.findOne({
        where: { userId: user.userId },
        relations: ['cohort'],
      });

      if (!studentRecord) {
        throw new UnauthorizedException('Student record not found');
      }

      student = studentRecord;
    }

    // Generate JWT token
    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      student
    };
    const accessToken = this.jwtStrategyService.generateToken(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const result: { user: User; student?: Student; accessToken: string } = {
      user: userWithoutPassword as User,
      accessToken,
    };

    if (student) {
      result.student = student;
    }

    return result;
  }

  /**
   * Login với Google/Firebase token từ FE
   * @param googleLoginDto - chứa idToken do Firebase FE gửi lên
   * @returns User và access token hệ thống
   */
  async loginWithGoogle(googleLoginDto: GoogleLoginDto): Promise<{ user: User; accessToken: string }> {
    try {
      // Xác thực token bằng Firebase Admin
      const payload = await this.firebaseService.verifyToken(googleLoginDto.idToken);
      console.log('payload', payload);

      const { email, name, sub: googleId } = payload || {};

      if (!email) {
        throw new UnauthorizedException('Email không tồn tại trong token Google');
      }

      // Find existing user by email
      let user = await this.userRepository.findOne({
        where: { email },
      });

      if(!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      // Generate JWT token
      const jwtPayload = { sub: user.userId, email: user.email, role: user.role };
      const accessToken = this.jwtStrategyService.generateToken(jwtPayload);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Handle Google verification errors
      throw new UnauthorizedException('Google token không hợp lệ hoặc xác thực thất bại');
    }
  }

  /**
   * Validate user for JWT strategy
   * @param userId - User ID
   * @returns User or null
   */
  async validateUser(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user || !user.status) {
      return null;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

