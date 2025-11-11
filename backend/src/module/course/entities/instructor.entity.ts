import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CourseSection } from './course-section.entity';

@Entity({ name: 'instructors' })
export class Instructor {
  @PrimaryGeneratedColumn({ name: 'instructor_id' })
  instructorId: number;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', name: 'department' })
  department: string;

  @Column({ type: 'varchar', name: 'title', nullable: true })
  title: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CourseSection, (section) => section.instructor)
  sections: CourseSection[];
}

