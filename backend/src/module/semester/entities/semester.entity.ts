import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SemesterStatus } from 'src/common/constant/enum';
import { Student } from '../../user/entities/student.entity';
import { CourseSection } from '../../course/entities/course-section.entity';

@Entity({ name: 'semesters' })
export class Semester {
  @PrimaryGeneratedColumn({ name: 'semester_id' })
  semesterId: number;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', name: 'status' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Student, (student) => student.semester)
  students: Student[];

  @OneToMany(() => CourseSection, (section) => section.semester)
  courseSections: CourseSection[];
}


