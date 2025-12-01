import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { WelcomePage } from '@/features/welcome/welcome-page'
import { useAuthStore } from '@/stores/auth-store'

function IndexPage() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const isAdmin =
    Array.isArray(auth.user?.role) &&
    auth.user?.role.some((r) => r.toLowerCase() === 'admin')

  useEffect(() => {
    if (isAdmin) {
      navigate({ to: '/admin/cohort-schedule', replace: true })
    }
  }, [isAdmin, navigate])

  if (isAdmin) {
    // Đang redirect admin sang trang quản lý đợt đăng ký
    return null
  }

  return <WelcomePage />
}

export const Route = createFileRoute('/_authenticated/')({
  component: IndexPage,
})
