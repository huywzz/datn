import {DataSource, Repository} from 'typeorm';
import {getDataSourceToken} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import {Student} from './entities/student.entity';
import {UserRepository} from './repository/user.repository';
import {StudentRepository} from './repository/student.repository';
import {USER_REPOSITORY, STUDENT_REPOSITORY} from 'src/common/constant/repository';
import {RedisProviderService} from "../../provider/redis/redis-provider.service";

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
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Student),
        inject: [getDataSourceToken()],
    },
    // Provide repository class directly for service injection
    {
        provide: StudentRepository,
        useFactory: (
            studentRepo: Repository<Student>,
            redisService: RedisProviderService,
        ) => {
            return new StudentRepository(studentRepo, redisService);
        },
        inject: [STUDENT_REPOSITORY, RedisProviderService],
    },
];
