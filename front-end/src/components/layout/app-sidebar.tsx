import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { adminSidebarData } from './data/admin-sidebar-data'
import { sidebarData } from './data/sidebar-data'
import { NavGroup as NavGroupComponent } from './nav-group'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { auth } = useAuthStore()

  // Check if user has admin role
  const isAdmin = auth.user?.role?.some((r: string) => r.toLowerCase() === 'admin')

  const currentSidebarData = isAdmin ? adminSidebarData : sidebarData

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={currentSidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {currentSidebarData.navGroups.map((props) => (
          <NavGroupComponent key={props.title} title={props.title} items={props.items} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
