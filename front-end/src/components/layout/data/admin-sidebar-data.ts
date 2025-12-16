import {
    LayoutDashboard,
    CalendarRange,
    // Upload,
    UserPlus,
    Book,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const adminSidebarData: SidebarData = {
    user: {
        name: 'Admin',
        email: 'admin@example.com',
        avatar: '/avatars/shadcn.jpg',
    },
    teams: [
        {
            name: 'EduManage Admin',
            logo: LayoutDashboard,
            plan: 'Administrator',
        },
    ],
    navGroups: [
        {
            title: 'Quản lý',
            items: [
                {
                    title: 'Quản lý đợt đăng ký',
                    url: '/admin/cohort-schedule',
                    icon: CalendarRange,
                },
                {
                    title: 'Quản lý lớp học phần',
                    url: '/courses',
                    icon: Book,
                },
                {
                    title: 'Đăng ký cho sinh viên',
                    url: '/admin/registration',
                    icon: UserPlus,
                }
            ],
        },
    ],
}
