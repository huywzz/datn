import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/constant/enum';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({ description: 'User status', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'User password', example: 'password123' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'User status', example: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

