import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { LoginDto, RegisterDto, GoogleLoginDto } from '../dto/auth.dto';
import { User } from '../../user/entities/user.entity';
import { Student } from '../../user/entities/student.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (admin or student)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @ApiResponse({ status: 404, description: 'Cohort not found (for student registration)' })
  async register(@Body() registerDto: RegisterDto): Promise<{ user: User; student?: Student; accessToken: string }> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user (admin or student)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<{ user: User; student?: Student; accessToken: string }> {
    return await this.authService.login(loginDto);
  }

  @Post('login/google')
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200, description: 'Login with Google successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async loginWithGoogle(@Body() googleLoginDto: GoogleLoginDto): Promise<{ user: User; accessToken: string }> {
    return await this.authService.loginWithGoogle(googleLoginDto);
  }
}

