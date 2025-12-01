import { forwardRef, Module } from '@nestjs/common';
import { MysqlProviderModule } from 'src/provider';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { userProviders } from './user.provider';
import { UserRepository } from './repository/user.repository';
import { StudentRepository } from './repository/student.repository';
import { StudentController } from './controller/student.controller';
import { StudentService } from './service/student.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MysqlProviderModule,forwardRef(() => AuthModule)],
  controllers: [UserController, StudentController],
  providers: [...userProviders, UserService, StudentService],
  exports: [UserService, StudentService, UserRepository, StudentRepository],
})
export class UserModule {}
