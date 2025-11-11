import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { commonSidebarData } from './data/common-sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAuthStore } from '@/stores/auth-store'

export function CommonSidebar() {
  const { collapsible, variant } = useLayout()
  const { auth } = useAuthStore()

  const displayName =
    auth.student?.fullName ||
    auth.user?.name ||
    (auth.user?.email ? auth.user.email.split('@')[0] : commonSidebarData.user.name)
  const displayEmail = auth.user?.email || commonSidebarData.user.email
  const user = {
    name: displayName,
    email: displayEmail,
    avatar: commonSidebarData.user.avatar,
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={commonSidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {commonSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
