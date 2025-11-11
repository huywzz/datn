import { Injectable, NotFoundException } from '@nestjs/common';
import { SemesterRepository } from '../repository/semester.repository';
import { Semester } from '../entities/semester.entity';
import { SemesterStatus } from 'src/common/constant/enum';

@Injectable()
export class SemesterService {
  constructor(private readonly semesterRepository: SemesterRepository) {}

  async create(input: { startDate: Date; endDate: Date; status?: SemesterStatus }): Promise<Semester> {
    const entity = this.semesterRepository.create({
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status ?? SemesterStatus.ACTIVE,
    });
    return this.semesterRepository.save(entity);
  }

  async findAll(): Promise<Semester[]> {
    return this.semesterRepository.find();
  }

  async findOne(id: number): Promise<Semester> {
    const found = await this.semesterRepository.findOne({ where: { semesterId: id } });
    if (!found) {
      throw new NotFoundException('Semester not found');
    }
    return found;
  }

  async update(id: number, input: Partial<Pick<Semester, 'startDate' | 'endDate' | 'status'>>): Promise<Semester> {
    const found = await this.findOne(id);
    if (input.startDate !== undefined) found.startDate = input.startDate as Date;
    if (input.endDate !== undefined) found.endDate = input.endDate as Date;
    if (input.status !== undefined) found.status = input.status as SemesterStatus;
    return this.semesterRepository.save(found);
  }

  async softDelete(id: number): Promise<void> {
    await this.semesterRepository.softDelete({ semesterId: id });
  }

  async restore(id: number): Promise<void> {
    await this.semesterRepository.restore({ semesterId: id });
  }
}


