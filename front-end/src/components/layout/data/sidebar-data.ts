import {
  LayoutDashboard,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  BookOpen,
  CalendarCheck,
  List,
  Calendar,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Nguyễn Văn A',
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
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
       
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
