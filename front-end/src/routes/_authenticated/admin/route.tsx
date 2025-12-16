import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    // Check if user has student role (students cannot access admin routes)
    const isStudent =
      Array.isArray(auth.user?.role) &&
      auth.user?.role.some((r) => r.toLowerCase() === 'student')

    if (isStudent) {
      // Redirect students to 403 Forbidden page
      throw redirect({
        to: '/403',
        replace: true,
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
