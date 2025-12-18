import { useAuthStore } from '@/stores/auth-store'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    errMsg = error.response?.data?.title || 
             error.response?.data?.message || 
             error.message || 
             'Something went wrong!'
  }
  // if (error instanceof AxiosError) {
  //   if (error.response?.status === 401) {
  //     toast.error('Phiên đăng nhập đã hết hạn!')
  //     useAuthStore.getState().auth.reset()
  //     // Use window.location for redirect to ensure it works even if router is not ready
  //     const currentPath = window.location.href
  //     window.location.href = `/sign-in`
  //   }
  // }

  toast.error(errMsg)
}
