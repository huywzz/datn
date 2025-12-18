import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { BookOpen } from 'lucide-react'
import { DragDropRegistration } from './components/drag-drop-registration'


export function CreditRegistration() {
  const [registeredSubjects, setRegisteredSubjects] = useState<string[]>([])

  const handleUpdateRegisteredSubjects = (subjects: string[]) => {
    setRegisteredSubjects(subjects)
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className='overflow-y-auto'>
        <div className='flex flex-col gap-6 p-6'>
          {/* Header Section */}
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <BookOpen className='h-6 w-6 text-primary' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Đăng ký tín chỉ</h1>
              <p className='text-muted-foreground'>Chọn và đăng ký các môn học trong học kỳ</p>
            </div>
          </div>

          {/* Drag and Drop Registration with Schedule */}
          <DragDropRegistration 
            registeredSubjects={registeredSubjects}
            onUpdateRegisteredSubjects={handleUpdateRegisteredSubjects}
          />
        </div>
      </Main>
    </>
  )
}
