import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Cohort } from '../../cohort/entities/cohort.entity';
import { User } from './user.entity';
import { Semester } from '../../semester/entities/semester.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn({ name: 'student_id' })
  id: number;

  @Column({ name: 'student_code', type: 'varchar',unique: true })
  studentCode: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', name: 'class_code' })
  classCode: string;

  @Column({ type: 'varchar', name: 'major' })
  major: string;

  @Column({ type: 'integer', name: 'year_of_study' })
  yearOfStudy: number;
    
  @Column({ type: 'integer', name: 'current_year' })
  currentYear: number;

  @Column({ type: 'integer', name: 'current_semester' })
  currentSemester: number;

  @Column({ name: 'cohort_id', type: 'varchar' })
  cohortId: string;
    
  @ManyToOne(() => Cohort, (cohort) => cohort.students, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Cohort;
      
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Semester, (semester) => semester.students, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'current_semester' })
  semester: Semester;


  @OneToOne(() => User, (user) => user.student, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;
}