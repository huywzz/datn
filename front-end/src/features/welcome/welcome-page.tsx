import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function WelcomePage() {
  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="overflow-y-auto">
        <div className="flex flex-col gap-8 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Chào mừng</h1>
              <p className="text-muted-foreground">
                Chào mừng bạn đến hệ thống quản lý và đăng ký tín chỉ.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 px-6 py-10 flex flex-col items-center justify-center gap-4">
            <p className="text-lg font-medium text-center">
              Bắt đầu bằng việc đăng ký tín chỉ cho học kỳ hiện tại.
            </p>
            <Button asChild size="lg">
              <Link to="/credit-registration-schedule">Đi tới trang đăng ký tín chỉ</Link>
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}


