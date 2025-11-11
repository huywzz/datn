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
  schedule?: string
  status: string
  createdAt?: string
  updatedAt?: string
  course?: Course
  instructor?: Instructor
  classSchedules?: ClassSchedule[]
  [key: string]: unknown
}

export interface CourseSectionsResponse {
  success: boolean
  data?: CourseSection[]
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
