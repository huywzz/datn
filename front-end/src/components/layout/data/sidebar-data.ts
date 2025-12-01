import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  BookOpen,
  CalendarCheck,
  List,
  Calendar,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { getLocalStorage } from '@/lib/local-storage'

// Hydrate sidebar user from localStorage (auth_student) if available
let hydratedName = 'satnaing'
let hydratedEmail = 'satnaingdev@gmail.com'
try {
  const studentStr = typeof window !== 'undefined' ? getLocalStorage('auth_student') : null
  if (studentStr) {
    const student = JSON.parse(studentStr) as {
      fullName?: string
      studentCode?: string
    }
    if (student?.fullName) hydratedName = student.fullName
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
          icon: BookOpen,
          items: [
            {
              title: 'Đăng ký theo danh sách',
              url: '/credit-registration',
              icon: List,
            },
            {
              title: 'Đăng ký với thời khóa biểu',
              url: '/credit-registration-schedule',
              icon: Calendar,
            },
          ],
        },
        {
          title: 'Thời khóa biểu tạm thời',
          url: '/student-schedule',
          icon: CalendarCheck,
        },
         {
          title: 'Trao đổi tín chỉ',
          url: '/exchange-request',
          icon: CalendarCheck,
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
