import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { UserRepository } from './repository/user.repository';
import { StudentRepository } from './repository/student.repository';
import { USER_REPOSITORY, STUDENT_REPOSITORY } from 'src/common/constant/repository';

export const userProviders = [
  {
    provide: USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User).extend(UserRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository class directly for service injection
  {
    provide: UserRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User).extend(UserRepository),
    inject: [getDataSourceToken()],
  },
  {
    provide: STUDENT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Student).extend(StudentRepository),
    inject: [getDataSourceToken()],
  },
  // Provide repository class directly for service injection
  {
    provide: StudentRepository,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Student).extend(StudentRepository),
    inject: [getDataSourceToken()],
  },
];
