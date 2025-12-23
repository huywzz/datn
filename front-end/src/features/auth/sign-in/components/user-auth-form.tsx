import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { loginWithCredentials, type ApiUser } from '@/lib/api'
import type { StudentInfo } from '@/lib/interface'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(6, 'Password must be at least 6 characters long'),
})

export const normalizeUserFromApi = (user?: ApiUser | null) => {
  if (!user) {
    return null
  }

  const roles = Array.isArray(user.role)
    ? user.role.filter(Boolean)
    : user.role
      ? [user.role].filter(Boolean)
      : []

  return {
    userId: user.userId,
    name: user.name ?? (user.email ? user.email.split('@')[0] : undefined),
    email: user.email ?? '',
    role: roles,
    status: user.status,
    exp: user.exp,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const normalizeStudentFromApi = (student?: StudentInfo | null) => {
  if (!student) return null
  return {
    id: student.id,
    studentCode: student.studentCode,
    userId: student.userId,
    fullName: student.fullName,
    currentSemester: student.currentSemester,
    cohortId: student.cohortId,
    classCode: student.classCode,
    major: student.major,
    yearOfStudy: student.yearOfStudy,
    currentYear: student.currentYear,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  } satisfies StudentInfo
}

export function applyAuthResponse(
  authStore: ReturnType<typeof useAuthStore.getState>['auth'],
  response: {
    accessToken?: string | null
    token?: string | null
    access_token?: string | null
    user?: ApiUser | null
    student?: StudentInfo | null
    data?: {
      accessToken?: string | null
      token?: string | null
      access_token?: string | null
      user?: ApiUser | null
      student?: StudentInfo | null
    }
  },
  fallbackEmail?: string
) {
  const payload = response?.data ?? response
  const accessToken = payload?.accessToken || payload?.token || payload?.access_token

  if (accessToken) {
    authStore.setAccessToken(accessToken)
  }

  const userData = normalizeUserFromApi(payload?.user)

  if (userData) {
    authStore.setUser({
      ...userData,
      role: userData.role.length > 0 ? userData.role : ['user'],
    })
  } else if (accessToken) {
    authStore.setUser({
      email: fallbackEmail ?? '',
      role: ['user'],
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  }

  const studentData = normalizeStudentFromApi(payload?.student)
  if (studentData) {
    authStore.setStudent(studentData)
    const roleFromStudent = payload?.student?.role
    if (roleFromStudent) {
      const rolesArray = Array.isArray(roleFromStudent) ? roleFromStudent : [roleFromStudent]
      const current = useAuthStore.getState().auth.user
      if (current) {
        authStore.setUser({
          ...current,
          role: current.role?.length ? current.role : rolesArray,
        })
      }
    }
  }
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const loginPromise = loginWithCredentials(data.email, data.password)

      toast.promise(loginPromise, {
        loading: 'Đang đăng nhập...',
        success: 'Đăng nhập thành công!',
        error: (error) =>
          error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      })

      const result = await loginPromise

      applyAuthResponse(auth, result, data.email)

      const latestUser = useAuthStore.getState().auth.user
      const isAdmin =
        Array.isArray(latestUser?.role) &&
        latestUser?.role.some((r) => r.toLowerCase() === 'admin')

      // Admin -> trang quản lý đợt đăng ký, Student -> trang chào mừng
      const targetPath = isAdmin ? '/admin/cohort-schedule' : '/'
      navigate({ to: targetPath, replace: true })
    } catch (_error) {
      // toast already handled messaging
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              {/* <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                Forgot password?
              </Link> */}
            </FormItem>
          )}
        />
        <Button className='mt-2 gap-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <LogIn className='h-4 w-4' />}
          Đăng nhập
        </Button>
      </form>
    </Form>
  )
}
