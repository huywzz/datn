import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CourseSection } from './course-section.entity';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryColumn({ name: 'course_id', type: 'int' })
  courseId: number;

  @Column({ type: 'varchar', name: 'code' })
  code: string;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({ type: 'integer', name: 'credits' })
  credits: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CourseSection, (section) => section.course)
  sections: CourseSection[];
}

