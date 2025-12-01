import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  Settings,
  User,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const commonSidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/avatars/user.jpg',
  },
  teams: [
    {
      name: 'EduManage System',
      logo: LayoutDashboard,
      plan: 'Quản lý giáo dục',
    },
  ],
  navGroups: [
    {
      title: 'Trang chủ',
      items: [
        {
          title: 'Chào mừng',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Quản lý',
      items: [
        {
          title: 'Quản lý môn học',
          url: '/subjects',
          icon: BookOpen,
        },
        {
          title: 'Lớp học phần',
          url: '/classes',
          icon: GraduationCap,
        },
        {
          title: 'Sinh viên',
          url: '/students',
          icon: Users,
        },
        {
          title: 'Đăng ký tín chỉ',
          url: '/course-registration',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Báo cáo',
      items: [
        {
          title: 'Báo cáo / Thống kê',
          url: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        {
          title: 'Cài đặt',
          url: '/settings',
          icon: Settings,
        },
        {
          title: 'Hồ sơ',
          url: '/profile',
          icon: User,
        },
      ],
    },
  ],
}
