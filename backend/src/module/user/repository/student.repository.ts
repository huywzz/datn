import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { STUDENT_REPOSITORY } from 'src/common/constant/repository';

@Injectable()
export class StudentRepository extends Repository<Student> {
  constructor(@Inject(STUDENT_REPOSITORY) private studentRepository: Repository<Student>) {
    super(studentRepository.target, studentRepository.manager, studentRepository.queryRunner);
  }
}

