import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { USER_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(@Inject(USER_REPOSITORY) private userRepository: Repository<User>) {
    super(userRepository.target, userRepository.manager, userRepository.queryRunner);
  }
}

