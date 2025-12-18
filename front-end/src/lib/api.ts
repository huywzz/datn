import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import type {
  AvailableCourse,
  CredentialsLoginResponse,
  GoogleLoginResponse,
  AvailableCoursesResponse,
  CourseSection,
  CourseSectionsResponse,
  MyScheduleResponse,
  MyScheduleData,
  RegistrationResponse,
  CoursesResponse,
  CohortsResponse,
  SemestersResponse,
  Course,
  Cohort,
  Semester,
  SectionStudent,
  SectionStudentsResponse,
  StudentInfo,
  StudentsResponse,
} from './interface'

// Re-export types for convenience
export type { ApiUser, Course, AvailableCourse, CourseSection, MyScheduleData, MyScheduleItem, Cohort, Semester } from './interface'

const API_BASE_URL = 'http://localhost:3004'

/**
 * Helper function to handle API errors consistently
 * For 401/403/500 errors, re-throws the original AxiosError to trigger global handlers
 * For other errors, wraps with a custom message
 */
function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    // For auth/server errors, throw original error to trigger global handlers
    if (status === 401 || status === 403 || status === 500) {
      throw error
    }
    
    // For other errors, throw with custom message
    throw new Error(
      (error.response?.data as { message?: string; error?: string })?.message ||
      (error.response?.data as { message?: string; error?: string })?.error ||
      error.message ||
      defaultMessage
    )
  }
  throw error
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { auth } = useAuthStore.getState()
    const token = auth.accessToken

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export async function loginWithGoogle(idToken: string): Promise<GoogleLoginResponse> {
  try {
    const response = await api.post<GoogleLoginResponse>('/auth/login/google', {
      idToken,
    })
    return response.data
  } catch (error) {
    handleApiError(error, 'Đăng nhập thất bại')
  }
}

export async function loginWithCredentials(email: string, password: string) {
  try {
    const response = await api.post<CredentialsLoginResponse>('/auth/login', {
      email,
      password,
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Đăng nhập thất bại.')
    }

    return response.data
  } catch (error) {
    handleApiError(error, 'Đăng nhập thất bại')
  }
}

export async function getAvailableCourses(): Promise<AvailableCourse[]> {
  try {
    const response = await api.get<AvailableCoursesResponse>('/temporaries/available-courses')

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách môn học.')
    }

    return response.data.data || []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách môn học')
  }
}

export interface GetCourseSectionsParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  semesterId?: number
}

export async function getCourseSections(
  courseId: number,
  params?: GetCourseSectionsParams
): Promise<import('./interface').PaginatedCourseSectionsData> {
  try {
    const response = await api.get<import('./interface').CourseSectionsResponse>(
      `/course-sections/course/${courseId}`,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          sortBy: params?.sortBy || 'createdAt',
          sortOrder: params?.sortOrder || 'DESC',
          ...(params?.semesterId && { semesterId: params.semesterId }),
        },
      }
    )

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách lớp học phần.')
    }

    // Check if response is paginated
    const responseData = response.data.data
    if (responseData && 'total' in responseData) {
      return responseData as import('./interface').PaginatedCourseSectionsData
    }

    // Fallback for non-paginated response
    const sections = (responseData as import('./interface').CourseSection[]) || []
    return {
      data: sections,
      total: sections.length,
      page: 1,
      limit: sections.length || 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    }
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách lớp học phần')
  }
}

export async function getCourseSectionDetail(sectionId: number): Promise<CourseSection> {
  try {
    const response = await api.get<{ success: boolean; data?: CourseSection; message?: string }>(
      `/course-sections/${sectionId}`
    )

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.message || 'Không thể tải thông tin lớp học phần.')
    }

    return response.data.data
  } catch (error) {
    handleApiError(error, 'Không thể tải thông tin lớp học phần')
  }
}

export interface SearchCourseSectionsParams {
  page?: number
  limit?: number
  courseId?: number
  instructorId?: number
  semesterId?: number
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export async function searchCourseSections(
  params?: SearchCourseSectionsParams
): Promise<import('./interface').PaginatedCourseSectionsData> {
  try {
    const response = await api.get<import('./interface').CourseSectionsResponse>(
      '/course-sections/search',
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 100,
          sortBy: params?.sortBy || 'createdAt',
          sortOrder: params?.sortOrder || 'DESC',
          ...(params?.courseId && { courseId: params.courseId }),
          ...(params?.instructorId && { instructorId: params.instructorId }),
          ...(params?.semesterId && { semesterId: params.semesterId }),
          ...(params?.status && { status: params.status }),
          ...(params?.search && { search: params.search }),
        },
      }
    )

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tìm kiếm lớp học phần.')
    }

    // Check if response is paginated
    const responseData = response.data.data
    if (responseData && 'total' in responseData) {
      return responseData as import('./interface').PaginatedCourseSectionsData
    }

    // Fallback for non-paginated response
    const sections = (responseData as import('./interface').CourseSection[]) || []
    return {
      data: sections,
      total: sections.length,
      page: 1,
      limit: sections.length || 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    }
  } catch (error) {
    handleApiError(error, 'Không thể tìm kiếm lớp học phần')
  }
}

export async function getAllCourseSections(): Promise<CourseSection[]> {
  try {
    const response = await api.get<CourseSection[] | { success: boolean; data?: CourseSection[]; message?: string }>('/course-sections')
    
    // Check if response has wrapper format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const wrappedResponse = response.data as { success: boolean; data?: CourseSection[]; message?: string }
      if (!wrappedResponse.success) {
        throw new Error(wrappedResponse.message || 'Không thể tải danh sách lớp học phần.')
      }
      return wrappedResponse.data || []
    }
    
    // Direct array response
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        (error.response?.data as { message?: string; error?: string })?.message ||
        (error.response?.data as { message?: string; error?: string })?.error ||
        error.message ||
        'Không thể tải danh sách lớp học phần',
      )
    }
    throw error
  }
}

export async function getCourseDetails(courseId: number): Promise<Course> {
  try {
    const response = await api.get<{ success: boolean; data: Course }>(`/courses/${courseId}`)

    if (!response.data?.success) {
      throw new Error('Không thể tải thông tin môn học.')
    }

    return response.data.data
  } catch (error) {
    handleApiError(error, 'Không thể tải thông tin môn học')
  }
}

export async function getMySchedule(): Promise<MyScheduleData> {
  try {
    const response = await api.get<MyScheduleResponse>('/registrations/my-schedule')

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải thời khóa biểu.')
    }

    if (!response.data.data) {
      throw new Error('Không có dữ liệu thời khóa biểu.')
    }

    return response.data.data
  } catch (error) {
    handleApiError(error, 'Không thể tải thời khóa biểu')
  }
}

export async function getSectionOfStudent(): Promise<CourseSection[]> {
  try {
    const response = await api.get<CourseSection[] | { success: boolean; data?: CourseSection[]; message?: string }>('/registrations/section-of-student')
    
    // Check if response has wrapper format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const wrappedResponse = response.data as { success: boolean; data?: CourseSection[]; message?: string }
      if (!wrappedResponse.success) {
        throw new Error(wrappedResponse.message || 'Không thể tải danh sách lớp học phần.')
      }
      return wrappedResponse.data || []
    }
    
    // Direct array response
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách lớp học phần')
  }
}

export async function registerSection(
  sectionId: number,
  studentId?: number
): Promise<RegistrationResponse['data']> {
  try {
    const payload: { sectionId: number; studentId?: number } = { sectionId }
    if (typeof studentId === 'number') {
      payload.studentId = studentId
    }

    const response = await api.post<RegistrationResponse>('/registrations', payload)

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Đăng ký lớp học phần thất bại.')
    }

    return response.data.data
  } catch (error) {
    handleApiError(error, 'Đăng ký lớp học phần thất bại')
  }
}

export async function createCourseRegistrationPeriod(
  data: import('./interface').CreateCourseRegistrationPeriodDto
): Promise<import('./interface').CourseRegistrationPeriod> {
  try {
    const response = await api.post<import('./interface').CourseRegistrationPeriod>(
      '/course-registration-periods',
      data
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Tạo đợt đăng ký tín chỉ thất bại')
  }
}

// ==================== Exchange transactions ====================

export type ExchangeAction = 'ADD' | 'REMOVE'

export interface ExchangeRequestItemPayload {
  sectionId: number
  action: ExchangeAction
  note?: string
}

export interface CreateExchangeTransactionPayload {
  items: ExchangeRequestItemPayload[]
  description?: string
  status?: string
}

export interface ExchangeTransactionItem {
  exchangeId: number
  transactionId: number
  sectionId: number
  action: ExchangeAction
  note?: string | null
  createdAt: string
  updatedAt: string
  section?: CourseSection
}

export interface ExchangeTransaction {
  transactionId: number
  studentId: number
  status: string
  description?: string | null
  createdAt: string
  updatedAt: string
  student?: StudentInfo
  items: ExchangeTransactionItem[]
}

export async function createExchangeTransaction(
  payload: CreateExchangeTransactionPayload,
): Promise<ExchangeTransaction> {
  try {
    const response = await api.post<ExchangeTransaction | { success: boolean; data?: ExchangeTransaction; message?: string }>('/exchange-transactions', payload)
    
    // Check if response has wrapper format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const wrappedResponse = response.data as { success: boolean; data?: ExchangeTransaction; message?: string }
      if (!wrappedResponse.success) {
        throw new Error(wrappedResponse.message || 'Không thể tạo yêu cầu đổi lớp.')
      }
      if (!wrappedResponse.data) {
        throw new Error('Không có dữ liệu trả về từ server.')
      }
      return wrappedResponse.data
    }
    
    // Direct object response
    return response.data as ExchangeTransaction
  } catch (error) {
    handleApiError(error, 'Không thể tạo yêu cầu đổi lớp')
  }
}

export async function getMyExchangeTransactions(): Promise<ExchangeTransaction[]> {
  try {
    const response = await api.get<ExchangeTransaction[] | { success: boolean; data?: ExchangeTransaction[]; message?: string }>('/exchange-transactions/student')
    
    // Check if response has wrapper format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const wrappedResponse = response.data as { success: boolean; data?: ExchangeTransaction[]; message?: string }
      if (!wrappedResponse.success) {
        throw new Error(wrappedResponse.message || 'Không thể tải danh sách yêu cầu đổi lớp.')
      }
      return wrappedResponse.data || []
    }
    
    // Direct array response
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách yêu cầu đổi lớp')
  }
}

export async function getAllExchangeTransactions(): Promise<ExchangeTransaction[]> {
  try {
    const response = await api.get<ExchangeTransaction[] | { success: boolean; data?: ExchangeTransaction[]; message?: string }>('/exchange-transactions')
    
    // Check if response has wrapper format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      const wrappedResponse = response.data as { success: boolean; data?: ExchangeTransaction[]; message?: string }
      if (!wrappedResponse.success) {
        throw new Error(wrappedResponse.message || 'Không thể tải danh sách yêu cầu đổi lớp.')
      }
      return wrappedResponse.data || []
    }
    
    // Direct array response
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách yêu cầu đổi lớp')
  }
}

export async function deleteExchangeTransaction(transactionId: number): Promise<void> {
  try {
    await api.delete(`/exchange-transactions/${transactionId}`)
  } catch (error) {
    handleApiError(error, 'Xóa yêu cầu đổi lớp thất bại')
  }
}

export async function deleteRegistration(registrationId: number): Promise<void> {
  try {
    await api.delete(`/registrations/${registrationId}`)
  } catch (error) {
    handleApiError(error, 'Hủy đăng ký lớp học phần thất bại')
  }
}


export async function createCohortRegistrationSchedule(
  data: import('./interface').CreateCohortRegistrationScheduleDto
): Promise<import('./interface').CohortRegistrationSchedule> {
  try {
    const response = await api.post<import('./interface').CohortRegistrationSchedule>(
      '/cohort-registration-schedules',
      data
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Tạo lịch đăng ký thất bại')
  }
}

export async function importTemporary(
  file: File,
  registrationStartDate: string,
  registrationEndDate: string
): Promise<import('./interface').ImportResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('registrationStartDate', registrationStartDate)
    formData.append('registrationEndDate', registrationEndDate)

    const response = await api.post<import('./interface').ImportResponse>(
      '/temporaries/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Import dữ liệu thất bại')
  }
}

export async function importCourseSections(
  file: File,
  semesterId: number,
  cohortId: string
): Promise<import('./interface').ImportResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('semesterId', semesterId.toString())
    formData.append('cohortId', cohortId)

    const response = await api.post<import('./interface').ImportResponse>(
      '/course-sections/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Import lớp học phần thất bại')
  }
}

export interface GetCoursesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}

export async function getCourses(params?: GetCoursesParams): Promise<import('./interface').PaginatedCoursesData> {
  try {
    const response = await api.get<import('./interface').CoursesResponse>('/courses', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        sortBy: params?.sortBy || 'createdAt',
        sortOrder: params?.sortOrder || 'DESC',
        ...(params?.search && { search: params.search }),
      },
    })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách môn học.')
    }
    return response.data.data
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách môn học')
  }
}

export async function getSemesters(): Promise<Semester[]> {
  try {
    const response = await api.get<SemestersResponse>('/semesters')
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách học kỳ.')
    }
    return response.data.data || []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách học kỳ')
  }
}

export async function getCohorts(): Promise<Cohort[]> {
  try {
    const response = await api.get<CohortsResponse>('/cohorts')
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách khóa học.')
    }
    return response.data.data || []
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách khóa học')
  }
}

export async function searchStudents(params: {
  cohortId: string
  search: string
}): Promise<StudentInfo[]> {
  try {
    const response = await api.get<StudentsResponse>('/students', {
      params,
    })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tìm kiếm sinh viên.')
    }
    return response.data.data || []
  } catch (error) {
    handleApiError(error, 'Không thể tìm kiếm sinh viên')
  }
}

export interface GetSectionStudentsParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}

export async function getSectionStudents(
  sectionId: number,
  params?: GetSectionStudentsParams
): Promise<import('./interface').PaginatedSectionStudentsData> {
  try {
    const response = await api.get<import('./interface').SectionStudentsResponse>(
      `/course-sections/${sectionId}/students`,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          sortBy: params?.sortBy || 'createdAt',
          sortOrder: params?.sortOrder || 'DESC',
          ...(params?.search ? { search: params.search } : {}),
        },
      }
    )
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách sinh viên.')
    }

    // Check if response is paginated
    const responseData = response.data.data
    if (responseData && 'total' in responseData) {
      return responseData as import('./interface').PaginatedSectionStudentsData
    }

    // Fallback for non-paginated response
    const students = (responseData as import('./interface').SectionStudent[]) || []
    return {
      data: students,
      total: students.length,
      page: 1,
      limit: students.length || 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    }
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách sinh viên')
  }
}

export async function deleteSectionStudent(sectionId: number, registrationId: number): Promise<void> {
  try {
    await api.delete(`/course-sections/${sectionId}/students/${registrationId}`)
  } catch (error) {
    handleApiError(error, 'Không thể xóa sinh viên khỏi lớp học phần')
  }
}
