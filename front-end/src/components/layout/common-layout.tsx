import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { CommonSidebar } from '@/components/layout/common-sidebar'
import { CommonTopbar } from '@/components/layout/common-topbar'
import { SkipToMain } from '@/components/skip-to-main'
import { useAuthStore } from '@/stores/auth-store'

type CommonLayoutProps = {
  children?: React.ReactNode
}

export function CommonLayout({ children }: CommonLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { auth } = useAuthStore()
  
  // Build user display info from auth store
  const displayName =
    auth.student?.fullName ||
    auth.user?.name ||
    (auth.user?.email ? auth.user.email.split('@')[0] : 'Người dùng')
  const displayEmail = auth.user?.email || ''
  const displayRole = Array.isArray(auth.user?.role) && auth.user?.role.length > 0
    ? auth.user.role.join(', ')
    : 'student'
  const user = {
    name: displayName,
    email: displayEmail,
    avatar: '/avatars/user.jpg',
    role: displayRole,
  }

  const handleLogout = () => {
    auth.reset()
    // Redirect to login page
    window.location.href = '/sign-in'
  }

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <CommonSidebar />
        <SidebarInset
          className={cn(
            // Set content container, so we can use container queries
            '@container/content',

            // If layout is fixed, set the height
            // to 100svh to prevent overflow
            'has-[[data-layout=fixed]]:h-svh',

            // If layout is fixed and sidebar is inset,
            // set the height to 100svh - spacing (total margins) to prevent overflow
            'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          <CommonTopbar 
            user={user}
            onLogout={handleLogout}
            fixed
          />
          <main className="flex-1 overflow-auto p-6">
            {children ?? <Outlet />}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
