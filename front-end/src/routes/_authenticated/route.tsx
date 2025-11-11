import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const { auth } = useAuthStore.getState()

    // Check if user has access token
    if (!auth.isAuthenticated()) {
      // Redirect to sign-in page with current location as redirect parameter
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
        replace: true,
      })
    }
  },
  component: AuthenticatedLayout,
})
