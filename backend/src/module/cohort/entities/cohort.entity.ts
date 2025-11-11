import { Entity, Column, PrimaryColumn, UpdateDateColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Student } from '../../user/entities/student.entity';

@Entity({ name: 'cohorts' })
export class Cohort {
  @PrimaryColumn({ type: 'varchar', name: 'id' })
  id: string;

  @Column({ type: 'varchar', name: 'code' })
  code: string;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({ type: 'datetime', name: 'start_year', })
  startYear: Date;

  @Column({ type: 'datetime', name: 'end_year' })
  endYear: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Student, (student) => student.cohort)
  students: Student[];
}
