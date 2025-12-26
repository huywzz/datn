import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { CohortSchedulePage } from './cohort-schedule-page'

export function CohortRegistrationManagement() {
  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className='overflow-y-auto'>
        <div className='flex flex-col gap-6 p-6'>
          {/* Header Section */}
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='h-6 w-6 text-primary'
              >
                <rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
                <line x1='16' x2='16' y1='2' y2='6' />
                <line x1='8' x2='8' y1='2' y2='6' />
                <line x1='3' x2='21' y1='10' y2='10' />
              </svg>
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Mở đợt đăng ký tín chỉ</h1>
              {/* <p className='text-muted-foreground'>Tạo đợt đăng ký tín chỉ cho các khóa học</p> */}
            </div>
          </div>

          <CohortSchedulePage />
        </div>
      </Main>
    </>
  )
}

