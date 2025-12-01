import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Student } from '../../user/entities/student.entity';
import { CourseSection } from '../../course/entities/course-section.entity';

@Entity({ name: 'registrations' })
export class Registration {
  @PrimaryGeneratedColumn({ name: 'registration_id' })
  registrationId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ name: 'section_id' })
  sectionId: number;

  @Column({ type: 'datetime', name: 'registered_at' })
  registeredAt: Date;

  @Column({ type: 'varchar', name: 'status', default: 'active' })
  status: string;

  @Column({ type: 'integer', name: 'semester' })
  semester: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => CourseSection, (section) => section.registrations, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: CourseSection;
}

