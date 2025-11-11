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
} from './interface'

// Re-export types for convenience
export type { ApiUser, Course, AvailableCourse, CourseSection, MyScheduleData, MyScheduleItem } from './interface'

const API_BASE_URL = 'http://localhost:3004'

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
    if (error instanceof AxiosError) {
      // Re-throw with more context
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Đăng nhập thất bại'
      )
    }
    throw error
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
    if (error instanceof AxiosError) {
      throw new Error(
        (error.response?.data as { message?: string; error?: string })?.message ||
          (error.response?.data as { message?: string; error?: string })?.error ||
          error.message ||
          'Đăng nhập thất bại',
      )
    }

    throw error
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
    if (error instanceof AxiosError) {
      throw new Error(
        (error.response?.data as { message?: string; error?: string })?.message ||
          (error.response?.data as { message?: string; error?: string })?.error ||
          error.message ||
          'Không thể tải danh sách môn học',
      )
    }

    throw error
  }
}

export async function getCourseSections(courseId: number): Promise<CourseSection[]> {
  try {
    const response = await api.get<CourseSectionsResponse>(`/course-sections/course/${courseId}`)

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách lớp học phần.')
    }

    return response.data.data || []
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
    if (error instanceof AxiosError) {
      throw new Error(
        (error.response?.data as { message?: string; error?: string })?.message ||
          (error.response?.data as { message?: string; error?: string })?.error ||
          error.message ||
          'Không thể tải thời khóa biểu',
      )
    }

    throw error
  }
}

export async function registerSection(sectionId: number): Promise<RegistrationResponse['data']> {
  try {
    const response = await api.post<RegistrationResponse>('/registrations', {
      sectionId,
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Đăng ký lớp học phần thất bại.')
    }

    return response.data.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        (error.response?.data as { message?: string; error?: string })?.message ||
          (error.response?.data as { message?: string; error?: string })?.error ||
          error.message ||
          'Đăng ký lớp học phần thất bại',
      )
    }

    throw error
  }
}

