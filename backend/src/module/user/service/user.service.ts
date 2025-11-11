import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repository/user.repository';
import { CreateUserDto } from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User data to create
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
      status: createUserDto.status ?? true,
    });

    return await this.userRepository.save(user);
  }
}

