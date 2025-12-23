import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  BookOpen,
  CalendarCheck,
  ArrowLeftRight,
  Inbox,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { getLocalStorage } from '@/lib/local-storage'

// Hydrate sidebar user from localStorage (auth_student) if available
let hydratedName = 'satnaing'
let hydratedEmail = 'satnaingdev@gmail.com'
try {
  const studentStr = typeof window !== 'undefined' ? getLocalStorage('auth_user') : null
  console.log('studentStr', JSON.parse(studentStr));
  if (studentStr) {
    const student = JSON.parse(studentStr) as {
      name?: string
      studentCode?: string
    }
    if (student?.name) hydratedName = student.name
    if (student?.studentCode) hydratedEmail = student.studentCode
  }
} catch {
  // ignore parse errors and keep defaults
}

export const sidebarData: SidebarData = {
  user: {
    name: hydratedName,
    email: hydratedEmail,
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: hydratedName,
      logo: Command,
      plan: '',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Đăng ký',
      items: [
        {
          title: 'Đăng ký tín chỉ',
          url: '/credit-registration',
          icon: BookOpen,
        },
        {
          title: 'Thời khóa biểu tạm thời',
          url: '/student-schedule',
          icon: CalendarCheck,
        },
        {
          title: 'Trao đổi tín chỉ',
          icon: ArrowLeftRight,
          items: [
            {
              title: 'Yêu cầu của tôi',
              url: '/exchange-request',
              icon: Inbox,
            },
            {
              title: 'Tất cả yêu cầu',
              url: '/exchange-request/all',
              icon: Users,
            },
          ],
        },
        // {
        //   title: 'Secured by Clerk',
        //   icon: ClerkLogo,
        //   items: [
        //     {
        //       title: 'Sign In',
        //       url: '/clerk/sign-in',
        //     },
        //     {
        //       title: 'Sign Up',
        //       url: '/clerk/sign-up',
        //     },

        //   ],
        // },
      ],
    }
  ],
}
