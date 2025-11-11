import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Registration } from '../entities/registration.entity';
import { REGISTRATION_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class RegistrationRepository extends Repository<Registration> {
  constructor(@Inject(REGISTRATION_REPOSITORY) private registrationRepository: Repository<Registration>) {
    super(registrationRepository.target, registrationRepository.manager, registrationRepository.queryRunner);
  }
}

