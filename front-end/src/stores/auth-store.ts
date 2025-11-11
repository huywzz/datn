import { create } from 'zustand'
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from '@/lib/local-storage'

const ACCESS_TOKEN = 'access_token'
const USER_INFO = 'auth_user'
const STUDENT_INFO = 'auth_student'

interface AuthUser {
  userId?: number
  accountNo?: string
  name?: string
  email: string
  role: string[]
  status?: boolean
  exp?: number
  createdAt?: string
  updatedAt?: string
}

interface StudentInfo {
  id: number
  studentCode: string
  userId: number
  fullName: string
  currentSemester: number
  cohortId: string
  role?: string | string[]
  classCode?: string
  major?: string
  yearOfStudy?: number
  currentYear?: number
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    student: StudentInfo | null
    setStudent: (student: StudentInfo | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Initialize token from localStorage
  const initToken = getLocalStorage(ACCESS_TOKEN) || ''
  // Initialize user from localStorage
  const initUserStr = getLocalStorage(USER_INFO)
  const initUser: AuthUser | null = (() => {
    if (!initUserStr) return null
    try {
      return JSON.parse(initUserStr) as AuthUser
    } catch {
      return null
    }
  })()
  // Initialize student from localStorage
  const initStudentStr = getLocalStorage(STUDENT_INFO)
  const initStudent: StudentInfo | null = (() => {
    if (!initStudentStr) return null
    try {
      return JSON.parse(initStudentStr) as StudentInfo
    } catch {
      return null
    }
  })()

  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          if (user) {
            setLocalStorage(USER_INFO, JSON.stringify(user))
          } else {
            removeLocalStorage(USER_INFO)
          }
          return { ...state, auth: { ...state.auth, user } }
        }),
      student: initStudent,
      setStudent: (student) =>
        set((state) => {
          if (student) {
            setLocalStorage(STUDENT_INFO, JSON.stringify(student))
          } else {
            removeLocalStorage(STUDENT_INFO)
          }
          return { ...state, auth: { ...state.auth, student } }
        }),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          if (accessToken) {
            setLocalStorage(ACCESS_TOKEN, accessToken)
          } else {
            removeLocalStorage(ACCESS_TOKEN)
          }
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeLocalStorage(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeLocalStorage(ACCESS_TOKEN)
          removeLocalStorage(USER_INFO)
          removeLocalStorage(STUDENT_INFO)
          return {
            ...state,
            auth: { ...state.auth, user: null, student: null, accessToken: '' },
          }
        }),
      isAuthenticated: () => {
        const token = get().auth.accessToken
        return !!token && token.trim() !== ''
      },
    },
  }
})
