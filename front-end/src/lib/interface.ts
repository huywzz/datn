export interface ApiUser {
  userId?: number
  accountNo?: string
  name?: string
  email?: string
  role?: string | string[]
  status?: boolean
  exp?: number
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface Course {
  courseId: number
  code: string
  name: string
  credits: number
  createdAt?: string
  updatedAt?: string
  sections?: CourseSection[]
}

export interface AvailableCourse {
  id: number
  courseId: number
  cohortId: string
  status: string
  createdAt?: string
  updatedAt?: string
  course: Course
}

export interface CredentialsLoginResponse {
  success: boolean
  data?: {
    user?: ApiUser
    accessToken?: string
    student?: StudentInfo
  }
  message?: string
}

export interface StudentInfo {
  id: number
  studentId?: number
  studentCode: string
  userId: number
  fullName: string
  classCode?: string
  major?: string
  yearOfStudy?: number
  currentYear?: number
  currentSemester: number
  cohortId: string
  createdAt?: string
  updatedAt?: string
  role?: string | string[]
}

export interface GoogleLoginResponse {
  accessToken?: string
  token?: string
  access_token?: string
  user?: ApiUser
  [key: string]: unknown
}

export interface AvailableCoursesResponse {
  success: boolean
  data?: AvailableCourse[]
  message?: string
}

export interface ClassSchedule {
  scheduleId: number
  sectionId: number
  dayOfWeek: string // "0" = CN, "1" = T2, "2" = T3, ..., "6" = T7
  startPeriod: number
  endPeriod: number
  room: string
  createdAt?: string
  updatedAt?: string
}

export interface Instructor {
  instructorId: number
  fullName: string
  department?: string
  title?: string
  createdAt?: string
  updatedAt?: string
}

export interface CourseSection {
  sectionId: number
  sectionCode: string
  courseId: number
  instructorId: number
  maxStudents: number
  currentStudents?: number
  schedule?: string
  status: string
  semesterId?: number
  createdAt?: string
  updatedAt?: string
  course?: Course
  instructor?: Instructor
  classSchedules?: ClassSchedule[]
  [key: string]: unknown
}

export interface PaginatedCourseSectionsData {
  data: CourseSection[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CourseSectionsResponse {
  success: boolean
  data?: CourseSection[] | PaginatedCourseSectionsData
  message?: string
}

export interface MyScheduleSection {
  sectionId: number
  sectionCode: string
  courseId: number
  courseName: string
  courseCode: string
  instructorId: number
}

export interface MyScheduleItem {
  scheduleId: number
  dayOfWeek: string // "0" = CN, "1" = T2, "2" = T3, ..., "6" = T7
  startPeriod: number
  endPeriod: number
  room: string
  registrationId?: number
  section: MyScheduleSection
}

export interface MyScheduleData {
  studentId: number
  studentCode: string
  fullName: string
  currentSemester: number
  schedules: MyScheduleItem[]
}

export interface MyScheduleResponse {
  success: boolean
  data?: MyScheduleData
  message?: string
}

export interface RegistrationResponse {
  success: boolean
  data?: {
    registrationId?: number
    sectionId: number
    studentId?: number
    [key: string]: unknown
  }
  message?: string
}

export interface CohortRegistrationSchedule {
  id: number;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCohortRegistrationScheduleDto {
  startTime: string;
  endTime: string;
}

export interface ImportResponse {
  success: number;
  errors: string[];
}

export interface Cohort {
  id: string
  code: string
  name: string
  startYear: string
  endYear: string
  updatedAt?: string
  createdAt?: string
}

export interface Semester {
  semesterId: number
  startDate: string
  endDate: string
  status: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface PaginatedCoursesData {
  data: Course[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CoursesResponse {
  success: boolean
  data: PaginatedCoursesData
  message?: string
}

export interface CohortsResponse {
  success: boolean
  data: Cohort[]
  message?: string
}

export interface SemestersResponse {
  success: boolean
  data: Semester[]
  message?: string
}

export interface SectionStudent {
  studentId: number
  studentCode: string
  fullName: string
  classCode?: string
  major?: string
  yearOfStudy?: number
  registrationId: number
  registeredAt: string
  semester: number
}

export interface PaginatedSectionStudentsData {
  data: SectionStudent[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface SectionStudentsResponse {
  success: boolean
  data?: SectionStudent[] | PaginatedSectionStudentsData
  message?: string
}

export interface StudentsResponse {
  success: boolean
  data: StudentInfo[]
  message?: string
}
