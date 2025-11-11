import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Instructor } from './instructor.entity';
import { ClassSchedule } from './class-schedule.entity';
import { Registration } from '../../registration/entities/registration.entity';
import { ExchangeRequest } from '../../registration/entities/exchange-request.entity';
import { Semester } from '../../semester/entities/semester.entity';

@Entity({ name: 'course_sections' })
export class CourseSection {
  @PrimaryGeneratedColumn({ name: 'section_id' })
  sectionId: number;

  @Column({ type: 'varchar', name: 'section_code' })
  sectionCode: string;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'instructor_id' })
  instructorId: number;

  @Column({ type: 'integer', name: 'max_students' })
  maxStudents: number;

  @Column({ type: 'varchar', name: 'schedule', nullable: true })
  schedule: string;

  @Column({ type: 'integer', name: 'current_students', default: 0 })
  currentStudents: number;

  @Column({ type: 'varchar', name: 'status', default: 'open' })
  status: string;

  @Column({ name: 'semester_id', type: 'int', nullable: true })
  semesterId?: number | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.sections, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Instructor, (instructor) => instructor.sections, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Instructor;

  @ManyToOne(() => Semester, (semester) => semester.courseSections, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'semester_id' })
  semester?: Semester | null;

  @OneToMany(() => ClassSchedule, (schedule) => schedule.section)
  classSchedules: ClassSchedule[];

  @OneToMany(() => Registration, (registration) => registration.section)
  registrations: Registration[];

  @OneToMany(() => ExchangeRequest, (exchange) => exchange.fromSection)
  fromExchangeRequests: ExchangeRequest[];

  @OneToMany(() => ExchangeRequest, (exchange) => exchange.desiredSection)
  desiredExchangeRequests: ExchangeRequest[];
}

