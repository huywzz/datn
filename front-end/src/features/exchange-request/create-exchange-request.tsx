import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  createExchangeTransaction,
  getSectionOfStudent,
  type ExchangeAction,
} from '@/lib/api'
import type { CourseSection } from '@/lib/interface'

function mapDayOfWeek(dayOfWeek: string) {
  const map: Record<string, string> = {
    '0': 'Chủ Nhật',
    '1': 'Thứ Hai',
    '2': 'Thứ Ba',
    '3': 'Thứ Tư',
    '4': 'Thứ Năm',
    '5': 'Thứ Sáu',
    '6': 'Thứ Bảy',
  }
  return map[dayOfWeek] || 'Thứ Hai'
}

type ExchangeItem = {
  id: string
  action: ExchangeAction
  sectionId: string
  note: string
}

export function CreateExchangeRequestPage() {
  const navigate = useNavigate()
  const [mySections, setMySections] = useState<CourseSection[]>([])
  const [items, setItems] = useState<ExchangeItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const sectionsData = await getSectionOfStudent()
        const sections = Array.isArray(sectionsData) ? sectionsData : []
        console.log('Loaded sections:', sections.length, sections)
        setMySections(sections)
        
        // Show toast if no courses registered
        if (sections.length === 0) {
          toast.warning('Bạn chưa đăng ký môn học nào')
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Không thể tải dữ liệu lớp học phần')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        action: 'ADD',
        sectionId: '',
        note: '',
      },
    ])
  }

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const loadMySections = async () => {
    try {
      const sectionsData = await getSectionOfStudent()
      setMySections(Array.isArray(sectionsData) ? sectionsData : [])
    } catch (error) {
      console.error('Không thể tải danh sách lớp học phần:', error)
    }
  }

  const handleUpdateItem = (itemId: string, updates: Partial<ExchangeItem>) => {
    // Load lại sections từ API khi action thay đổi để đảm bảo data luôn mới nhất
    if (updates.action !== undefined) {
      void loadMySections()
    }
    
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    )
  }

  const handleCreateRequest = async () => {
    // Chỉ lấy những items có sectionId hợp lệ
    const validItems = items.filter((item) => {
      const hasSectionId = item.sectionId && item.sectionId.trim() !== ''
      if (!hasSectionId) {
        console.log('Item without sectionId:', item)
      }
      return hasSectionId
    })
    
    console.log('All items:', items)
    console.log('Valid items:', validItems)
    
    if (validItems.length === 0) {
      toast.error('Vui lòng chọn lớp học phần cho ít nhất một môn học')
      return
    }

    const apiItems = validItems.map((item) => {
      const sectionId = Number(item.sectionId)
      console.log('Converting sectionId:', item.sectionId, 'to number:', sectionId)
      if (!Number.isFinite(sectionId) || sectionId <= 0) {
        throw new Error(`Section ID không hợp lệ: ${item.sectionId}`)
      }
      return {
        sectionId,
        action: item.action,
        note: item.note || (item.action === 'REMOVE' ? 'Remove this section' : 'Add this section'),
      }
    })
    
    console.log('API items to send:', apiItems)

    try {
      setIsSubmitting(true)
      await createExchangeTransaction({
        items: apiItems,
        description: 'Exchange course sections',
        status: 'pending',
      })

      toast.success('Tạo yêu cầu đổi lớp thành công')
      // Navigate back to list page
      void navigate({ to: '/exchange-request' })
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Tạo yêu cầu đổi lớp thất bại')
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/exchange-request' })}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </div>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <Plus className="w-8 h-8 text-primary" />
              Tạo yêu cầu đổi lớp mới
            </h1>
            <p className='text-muted-foreground text-base'>
              Thêm hoặc bỏ lớp học phần để tạo yêu cầu đổi lớp.
            </p>
          </div>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-primary" />
                Thông tin yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Danh sách items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Danh sách môn học</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      disabled={isLoading || mySections.length === 0}
                      className="gap-2"
                      title={mySections.length === 0 ? 'Bạn chưa đăng ký môn học nào' : undefined}
                    >
                      <Plus className="w-4 h-4" />
                      Thêm môn học
                    </Button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                      <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Chưa có môn học nào. Nhấn "Thêm môn học" để bắt đầu.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        // Luôn sử dụng mySections từ API registrations/section-of-student
                        const sectionsToShow = mySections
                        const validSections = sectionsToShow.filter((sec) => sec.sectionCode && sec.sectionId)
                        console.log('sectionsToShow:', sectionsToShow.length, 'validSections:', validSections.length)
                        const selectedSection = sectionsToShow.find(
                          (sec) => sec.sectionId.toString() === item.sectionId,
                        )

                        return (
                          <div
                            key={item.id}
                            className="p-5 border-2 rounded-lg bg-card space-y-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-primary">
                                Môn học #{index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Lớp học phần</label>
                                <Select
                                  value={item.sectionId || undefined}
                                  onValueChange={(value) => {
                                    console.log('Selected sectionId:', value, 'Type:', typeof value)
                                    handleUpdateItem(item.id, { sectionId: value })
                                  }}
                                  disabled={isLoading || sectionsToShow.length === 0}
                                >
                                  <SelectTrigger className="w-full h-10">
                                    <SelectValue 
                                      placeholder={
                                        isLoading 
                                          ? "Đang tải..." 
                                          : sectionsToShow.length === 0 
                                          ? "Không có lớp học phần" 
                                          : "Chọn lớp học phần"
                                      } 
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sectionsToShow.length === 0 ? (
                                      <div className="p-2 text-sm text-muted-foreground text-center">
                                        {isLoading ? 'Đang tải dữ liệu...' : 'Không có lớp học phần nào'}
                                      </div>
                                    ) : (
                                      sectionsToShow
                                        .filter((sec) => {
                                          // Lọc các section hợp lệ: chỉ cần có sectionCode và sectionId
                                          return sec.sectionCode && sec.sectionId
                                        })
                                        .map((sec) => {
                                          // Đảm bảo sectionId là number và hợp lệ
                                          const sectionId = typeof sec.sectionId === 'number' ? sec.sectionId : Number(sec.sectionId)
                                          
                                          if (!Number.isFinite(sectionId)) {
                                            console.warn('Invalid sectionId:', sec.sectionId, sec)
                                            return null
                                          }
                                          
                                          const schedules = sec.classSchedules || []
                                          const firstSchedule = schedules[0]
                                          const dayLabel = firstSchedule
                                            ? mapDayOfWeek(firstSchedule.dayOfWeek)
                                            : null
                                          const timeLabel = firstSchedule
                                            ? `Tiết ${firstSchedule.startPeriod}-${firstSchedule.endPeriod}`
                                            : sec.schedule || null
                                          const room = firstSchedule?.room
                                          
                                          // Tạo label đẹp và gọn gàng
                                          // API có thể không trả về course object, chỉ có courseId
                                          const courseName = sec.course?.name || `Môn học #${sec.courseId}` || ''
                                          const sectionCode = sec.sectionCode
                                          
                                          // Tạo phần hiển thị thông tin
                                          const infoParts: string[] = []
                                          if (dayLabel) infoParts.push(dayLabel)
                                          if (timeLabel) infoParts.push(timeLabel)
                                          if (room) infoParts.push(room)
                                          
                                          const displayText = infoParts.length > 0
                                            ? `${sectionCode}${courseName ? ` - ${courseName}` : ''} (${infoParts.join(', ')})`
                                            : `${sectionCode}${courseName ? ` - ${courseName}` : ''}`
                                          
                                          return (
                                            <SelectItem
                                              key={sectionId}
                                              value={sectionId.toString()}
                                            >
                                              {displayText}
                                            </SelectItem>
                                          )
                                        })
                                        .filter(Boolean)
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Action */}
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Hành động</label>
                                <Select
                                  value={item.action}
                                  onValueChange={(value) =>
                                    handleUpdateItem(item.id, {
                                      action: value as ExchangeAction,
                                      sectionId: '', // Reset section when action changes
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Chọn hành động" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ADD">Thêm (ADD)</SelectItem>
                                    <SelectItem value="REMOVE">Bỏ (REMOVE)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleCreateRequest} 
                  className="flex-1" 
                  disabled={isSubmitting || items.length === 0}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo yêu cầu...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo yêu cầu đổi lớp
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ to: '/exchange-request' })}
                  size="lg"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

export default CreateExchangeRequestPage

