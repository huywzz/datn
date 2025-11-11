import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { BookOpen, List, Calendar } from 'lucide-react'
import { ListRegistration } from './components/list-registration'
import { DragDropRegistration } from './components/drag-drop-registration'
import { useNavigate, useRouterState } from '@tanstack/react-router'


export function CreditRegistration() {
  const [registeredSubjects, setRegisteredSubjects] = useState<string[]>([])
  const location = useRouterState({ select: (s) => s.location })
  const navigate = useNavigate()
  const activeTab = location.pathname.endsWith('/credit-registration-schedule') ? 'schedule' : 'list'

  const handleUpdateRegisteredSubjects = (subjects: string[]) => {
    setRegisteredSubjects(subjects)
  }

  // Previously used by schedule preview; kept logic inline in DnD component if needed

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          {/* <ConfigDrawer /> */}
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

          {/* Tabs for different registration methods */}
          <Tabs value={activeTab} onValueChange={(v) => {
            if (v === 'schedule') navigate({ to: '/credit-registration-schedule' })
            if (v === 'list') navigate({ to: '/credit-registration' })
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Đăng ký theo danh sách
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Đăng ký với thời khóa biểu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <ListRegistration 
                registeredSubjects={registeredSubjects}
                onUpdateRegisteredSubjects={handleUpdateRegisteredSubjects}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <DragDropRegistration 
                registeredSubjects={registeredSubjects}
                onUpdateRegisteredSubjects={handleUpdateRegisteredSubjects}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
