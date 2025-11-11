import { Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { userProviders } from './user.provider';
import { UserRepository } from './repository/user.repository';
import { StudentRepository } from './repository/student.repository';

@Module({
  imports: [MysqlProviderModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
  exports: [UserService, UserRepository, StudentRepository],
})
export class UserModule {}
