import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { GoogleLoginButton } from './components/google-login-button'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='w-full max-w-md gap-4 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold tracking-tight'>
            Chào mừng trở lại
          </CardTitle>
          <CardDescription>
            Đăng nhập bằng email & mật khẩu hoặc tiếp tục với Google.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <UserAuthForm redirectTo={redirect} />
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-dashed' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background text-muted-foreground px-3 font-medium'>
                Hoặc
              </span>
            </div>
          </div>
          <GoogleLoginButton redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground w-full px-8 text-center text-sm'>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Chính sách bảo mật
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
